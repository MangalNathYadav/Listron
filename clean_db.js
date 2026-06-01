const fs = require('fs');

async function main() {
  console.log("Fetching snapshot...");
  const res = await fetch("https://e-learning-47448.firebaseio.com/lists.json");
  const lists = await res.json();
  
  if (!lists) {
    console.log("No lists found.");
    return;
  }

  let listsUpdated = 0;

  for (const listId in lists) {
    const list = lists[listId];
    if (!list.items) continue;

    const membersCount = list.members ? Object.keys(list.members).length : 1;
    const updates = {};
    let hasUpdates = false;

    for (const itemId in list.items) {
      const item = list.items[itemId];
      if (item.upvotes > membersCount) {
        console.log(`List ${listId} Item ${itemId}: Capping upvotes from ${item.upvotes} to ${membersCount}`);
        
        updates[`items/${itemId}/upvotes`] = membersCount;
        
        // Backfill upvotedBy
        if (list.members) {
           Object.values(list.members).slice(0, membersCount).forEach(m => {
             const safeKey = m.name.replace(/[.#$\[\]\/]/g, '_').toLowerCase();
             updates[`upvotedBy/${safeKey}/${itemId}`] = true;
           });
        } else {
           updates[`upvotedBy/anonymous/${itemId}`] = true;
        }
        hasUpdates = true;
      } else if (item.upvotes > 0) {
        // Backfill for existing valid upvotes
        const upvotesNeeded = item.upvotes;
        if (list.members) {
           Object.values(list.members).slice(0, upvotesNeeded).forEach(m => {
             const safeKey = m.name.replace(/[.#$\[\]\/]/g, '_').toLowerCase();
             updates[`upvotedBy/${safeKey}/${itemId}`] = true;
           });
           hasUpdates = true;
        }
      }
    }

    if (hasUpdates) {
      console.log(`Patching list ${listId} with updates...`);
      const patchRes = await fetch(`https://e-learning-47448.firebaseio.com/lists/${listId}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      
      if (patchRes.ok) {
        console.log(`Successfully patched list ${listId}`);
        listsUpdated++;
      } else {
        console.error(`Failed to patch list ${listId}:`, await patchRes.text());
      }
    }
  }

  console.log(`Finished. Updated ${listsUpdated} lists.`);
}

main().catch(console.error);
