class ChecksumWorkerManager {
  constructor(poolSize = 5) {
    this.config = {
      maxWorkers: poolSize,
      maxTasksPerWorker: 50,        // Recycle worker after N tasks
      idleTimeoutMs: 30000,         // Cleanup after 30s idle
      healthCheckIntervalMs: 10000, // Check worker health every 10s
      taskTimeoutMs: 60000,         // Max time per task
    };

    // Worker pool with metadata
    this.workers = new Map(); // workerId -> { worker, metadata }
    this.taskQueue = [];
    this.currentTasks = new Map(); // workerId -> task

    // Cleanup and monitoring
    this.healthCheckTimer = null;
    this.isShuttingDown = false;

    this.startHealthMonitoring();
  }

  /**
   * Create a new worker with full lifecycle management
   */
  createWorker() {
    const workerId = crypto.randomUUID();
    const worker = new Worker("/workers/hashWorker.js");

    const metadata = {
      createdAt: Date.now(),
      lastActivity: Date.now(),
      taskCount: 0,
      status: 'idle', // idle, busy, error
      idleTimer: null,
      taskTimer: null,
    };

    // Set up worker event handlers
    worker.onmessage = (event) => {
      this.handleWorkerMessage(workerId, event);
    };

    worker.onerror = (event) => {
      this.handleWorkerError(workerId, event);
    };

    // Store worker with metadata
    this.workers.set(workerId, { worker, metadata });

    return workerId;
  }

  /**
   * Handle worker completion/error messages
   */
  handleWorkerMessage(workerId, event) {
    const workerData = this.workers.get(workerId);
    if (!workerData) return;

    const { metadata } = workerData;

    if (event.data.status === "complete") {
      const currentTask = this.currentTasks.get(workerId);
      if (currentTask) {
        // Clear task timeout
        if (metadata.taskTimer) {
          clearTimeout(metadata.taskTimer);
          metadata.taskTimer = null;
        }

        // Resolve the task
        currentTask.resolve({
          file: currentTask.file,
          hash: event.data.hash,
          name: currentTask.file.name,
        });

        // Update metadata
        metadata.lastActivity = Date.now();
        metadata.taskCount++;
        metadata.status = 'idle';

        // Remove from current tasks
        this.currentTasks.delete(workerId);

        // Check if worker needs recycling
        if (metadata.taskCount >= this.config.maxTasksPerWorker) {
          this.recycleWorker(workerId);
        } else {
          // Process next task or start idle timer
          this.processNextTask(workerId);
        }
      }
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(workerId, event) {
    console.error(`ChecksumWorkerManager: Worker ${workerId} error:`, event.message);

    const workerData = this.workers.get(workerId);
    if (workerData) {
      workerData.metadata.status = 'error';

      // Reject current task if any
      const currentTask = this.currentTasks.get(workerId);
      if (currentTask) {
        currentTask.reject("Worker error: " + (event.message || 'Unknown error'));
        this.currentTasks.delete(workerId);
      }

      // Replace the failed worker
      this.replaceWorker(workerId);
    }
  }

  /**
   * Generate checksum using the worker pool
   */
  generateChecksum(file) {
    return new Promise((resolve, reject) => {
      const task = { file, resolve, reject, createdAt: Date.now() };
      this.taskQueue.push(task);

      // Try to assign to available worker or create new one
      this.assignTask();
    });
  }

  /**
   * Assign task to available worker or create new worker
   */
  assignTask() {
    if (this.taskQueue.length === 0) return;

    // Find idle worker
    let availableWorkerId = null;
    for (const [workerId, { metadata }] of this.workers) {
      if (metadata.status === 'idle' && !this.currentTasks.has(workerId)) {
        availableWorkerId = workerId;
        break;
      }
    }

    // Create new worker if none available and under limit
    if (!availableWorkerId && this.workers.size < this.config.maxWorkers) {
      availableWorkerId = this.createWorker();
    }

    // Assign task if worker available
    if (availableWorkerId) {
      this.processNextTask(availableWorkerId);
    }
  }

  /**
   * Process next task for specific worker
   */
  processNextTask(workerId) {
    const workerData = this.workers.get(workerId);
    if (!workerData || this.taskQueue.length === 0) {
      // No tasks - start idle timer
      this.startIdleTimer(workerId);
      return;
    }

    const { worker, metadata } = workerData;
    const task = this.taskQueue.shift();

    // Clear any existing idle timer
    if (metadata.idleTimer) {
      clearTimeout(metadata.idleTimer);
      metadata.idleTimer = null;
    }

    // Update metadata
    metadata.status = 'busy';
    metadata.lastActivity = Date.now();
    this.currentTasks.set(workerId, task);

    // Set task timeout
    metadata.taskTimer = setTimeout(() => {
      console.error(`⏰ ChecksumWorkerManager: Worker ${workerId} task timeout`);
      this.handleWorkerError(workerId, { message: 'Task timeout' });
    }, this.config.taskTimeoutMs);

    // Get PydioApi values and send to worker
    const multipartThreshold = PydioApi.getMultipartThreshold();
    const multipartPartSize = PydioApi.getMultipartPartSize();

    worker.postMessage({
      file: task.file,
      msg: "begin hash",
      multipartThreshold,
      multipartPartSize
    });

    // Check if more tasks can be assigned
    if (this.taskQueue.length > 0) {
      this.assignTask();
    }
  }

  /**
   * Start idle timer for worker cleanup
   */
  startIdleTimer(workerId) {
    const workerData = this.workers.get(workerId);
    if (!workerData || this.isShuttingDown) return;

    const { metadata } = workerData;

    // Clear existing timer
    if (metadata.idleTimer) {
      clearTimeout(metadata.idleTimer);
    }

    metadata.idleTimer = setTimeout(() => {
      if (this.taskQueue.length === 0 && !this.currentTasks.has(workerId)) {
        this.removeWorker(workerId);
      }
    }, this.config.idleTimeoutMs);
  }

  /**
   * Recycle worker that has processed too many tasks
   */
  recycleWorker(workerId) {
    this.removeWorker(workerId);

    // Create replacement if we have pending tasks
    if (this.taskQueue.length > 0) {
      const newWorkerId = this.createWorker();
      this.processNextTask(newWorkerId);
    }
  }

  /**
   * Replace failed worker
   */
  replaceWorker(workerId) {
    this.removeWorker(workerId);

    // Always create replacement for failed workers
    const newWorkerId = this.createWorker();

    // Process next task if available
    if (this.taskQueue.length > 0) {
      this.processNextTask(newWorkerId);
    }
  }

  /**
   * Remove worker and cleanup
   */
  removeWorker(workerId) {
    const workerData = this.workers.get(workerId);
    if (!workerData) return;

    const { worker, metadata } = workerData;

    // Clear timers
    if (metadata.idleTimer) clearTimeout(metadata.idleTimer);
    if (metadata.taskTimer) clearTimeout(metadata.taskTimer);

    // Terminate worker
    worker.terminate();

    // Remove from maps
    this.workers.delete(workerId);
    this.currentTasks.delete(workerId);
  }

  /**
   * Health monitoring system
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(() => {
      if (this.isShuttingDown) return;

      const now = Date.now();

      // Check for stale workers
      for (const [workerId, { metadata }] of this.workers) {
        const age = now - metadata.lastActivity;

        if (age > this.config.taskTimeoutMs * 2) {
          this.replaceWorker(workerId);
        }
      }

    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Get current status
   */
  getStatus() {
    const workers = Array.from(this.workers.entries()).map(([id, { metadata }]) => ({
      id,
      status: metadata.status,
      taskCount: metadata.taskCount,
      age: Date.now() - metadata.createdAt,
      lastActivity: Date.now() - metadata.lastActivity,
    }));

    return {
      workers,
      queueSize: this.taskQueue.length,
      activeTasks: this.currentTasks.size,
      totalWorkers: this.workers.size,
    };
  }

  /**
   * Shutdown all workers
   */
  terminate() {
    this.isShuttingDown = true;

    // Clear health monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Remove all workers
    for (const workerId of this.workers.keys()) {
      this.removeWorker(workerId);
    }

    // Clear queues
    this.taskQueue = [];
    this.currentTasks.clear();
  }
}

export default ChecksumWorkerManager;