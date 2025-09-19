class ChecksumWorkerManager {
  constructor(poolSize = 5) {
    this.poolSize = poolSize;
    this.workers = new Map(); // Map of active workers
    this.taskQueue = [];
    this.currentTasks = new Map(); // Track current task for each worker
  }

  initWorker() {
    const worker = new Worker("/workers/hashWorker.js");
    const workerId = crypto.randomUUID();

    worker.onmessage = (event) => {
      if (event.data.status === "complete") {
        const currentTask = this.currentTasks.get(workerId);
        if (currentTask) {
          currentTask.resolve({
            file: currentTask.file,
            hash: event.data.hash,
            name: currentTask.file.name,
          });
          this.currentTasks.delete(workerId);
        }
        this.processNextTask(workerId, worker);
      }
    };

    worker.onerror = (event) => {
      const currentTask = this.currentTasks.get(workerId);
      if (currentTask) {
        currentTask.reject("Worker error: " + event.message);
        this.currentTasks.delete(workerId);
      }
      this.processNextTask(workerId, worker);
    };

    this.workers.set(workerId, worker);
    return workerId;
  }

  generateChecksum(file) {
    return new Promise((resolve, reject) => {
      const task = { file, resolve, reject };
      this.taskQueue.push(task);

      // Only create a new worker if we have more tasks than workers
      // and we haven't reached the pool size limit
      if (
        this.taskQueue.length > this.workers.size &&
        this.workers.size < this.poolSize
      ) {
        const workerId = this.initWorker();
        this.processNextTask(workerId, this.workers.get(workerId));
      }
      // If we have available workers, find one and process the task
      else if (this.workers.size > 0) {
        for (const [workerId, worker] of this.workers) {
          if (!this.currentTasks.has(workerId)) {
            this.processNextTask(workerId, worker);
            break;
          }
        }
      }
    });
  }

  processNextTask(workerId, worker) {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      this.currentTasks.set(workerId, task);

      // Get PydioApi values and pass them to worker
      const multipartThreshold = PydioApi.getMultipartThreshold();
      const multipartPartSize = PydioApi.getMultipartPartSize();

      worker.postMessage({
        file: task.file,
        msg: "begin hash",
        multipartThreshold,
        multipartPartSize
      });
    } else if (this.currentTasks.size === 0) {
      // No more tasks in queue and no running tasks - cleanup workers
      this.cleanupWorkers();
    }
  }

  cleanupWorkers() {
    for (const [workerId, worker] of this.workers) {
      worker.terminate();
    }
    this.workers.clear();
  }

  terminate() {
    this.cleanupWorkers();
    this.taskQueue = [];
    this.currentTasks.clear();
  }
}

export default ChecksumWorkerManager;