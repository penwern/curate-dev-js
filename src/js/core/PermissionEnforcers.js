const permissionHandlers = {
    upload:{
        enforceWorkspaceUpload:{
            event: "drop",
            target: document,
            description: "enforce workspace upload permissions for standard users",
            handler: (e)=>{
                pydio.user.getIdmUser().then(idmUser=>{
                    if (!['quarantine', 'personal-files', 'common files'].includes(Curate.workspaces.getOpenWorkspace()) && !idmUser.Roles.find(r=>r.Label = "Admin") && e.dataTransfer?.files.length > 0){
                        e.stopImmediatePropagation()
                        const content = `<div>
                            <p>Please upload your content to the Quarantine workspace instead. This will ensure your content is correctly scanned for malware before being released into the system.</p>
                            <p>You can also upload your content to the Personal and Common Files workspaces, which is scanned for malware once but will not be quarantined and cannot be released into the system.</p>
                        </div>`;
                        Curate.ui.modals.curatePopup({"title": "You do not have permission to upload to this workspace", "type": "warning", "content":content}).fire() 
                    }
                })
            }
        }  
    },
    sharedSite:{
        enforceNoCustomActions:{
            event: "readystatechange", 
            target: document,
            description: "enforce no custom actions for shared sites",
            handler: (e)=>{
                // console.log("shared site enforce no custom actions")
                if (window.location.pathname.includes("/public/") && false == true){
                    const mutationObserver = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            if (mutation.type === "childList"){
                                const moreButton = document.querySelector(".toolbars-button-menu.action-group_more_action");
                                const darkModeButton = Array.from(document.querySelector("#main-toolbar").children).find(n=>n.type === "button" && n.querySelector('.action-local_toggle_theme'))
                                const newButton = Array.from(document.querySelectorAll(".toolbars-button-menu")).find(n=>n.classList.length == 1)
                                moreButton ? moreButton.remove() : null;
                                darkModeButton ? darkModeButton.remove() : null;
                                newButton ? newButton.remove() : null;
                            }
                        });
                    });
                    mutationObserver.observe(document.body, {childList: true});
                }
                if (window.location.pathname.includes("/public/")){
                    const moreButton = document.querySelector(".toolbars-button-menu.action-group_more_action");
                    const darkModeButton = Array.from(document.querySelector("#main-toolbar").children).find(n=>n.type === "button" && n.querySelector('.action-local_toggle_theme'))
                    const newButton = Array.from(document.querySelectorAll(".toolbars-button-menu")).find(n=>n.classList.length == 1)
                    moreButton ? moreButton.remove() : null;
                    darkModeButton ? darkModeButton.remove() : null;
                    newButton ? newButton.remove() : null;
                }
            }
        }
    },
    move:{

    }
}

//main, onload attach all permission enforcing event handlers described above.
document.addEventListener("DOMContentLoaded",e=>{

    attachAllEventHandlers(permissionHandlers)
})

//functions
function attachAllEventHandlers(permissionEvents) {
    Object.entries(permissionEvents).forEach(([category, events]) => {
        Object.entries(events).forEach(([eventName, {event, target, handler}]) => {
            // console.log("attaching event handler", permissionEvents[category][eventName])
            try{
                target.addEventListener(event, handler);
            }catch(err){
                console.error("could not attach: ", permissionEvents[category][eventName])
            }   
        });
    });
}