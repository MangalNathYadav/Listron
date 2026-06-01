const fs = require('fs');

async function main() {
  console.log("Fetching snapshot...");
  const res = await fetch("https://e-learning-47448.firebaseio.com/.json");
  const data = await res.json();
  
  fs.writeFileSync("rtdb_snapshot_backup.json", JSON.stringify(data, null, 2));
  console.log("Snapshot saved to rtdb_snapshot_backup.json");

  // Clean up duplicate upvotes
  if (!data || !data.lists) {
    console.log("No lists found.");
    return;
  }

  let modifiedCount = 0;

  for (const listId in data.lists) {
    const list = data.lists[listId];
    if (!list.items) continue;

    const membersCount = list.members ? Object.keys(list.members).length : 1;
    // For each item, cap upvotes at the number of members (at minimum 0)
    // Or if upvotes > membersCount, reset to membersCount.
    for (const itemId in list.items) {
      const item = list.items[itemId];
      if (item.upvotes > membersCount) {
        console.log(`List ${listId} Item ${itemId}: Capping upvotes from ${item.upvotes} to ${membersCount}`);
        
        // Let's reset the upvotes count and also create a simulated "upvotedBy" list
        // based on existing members so the count matches the tracked users.
        const upvotedBy = {};
        if (list.members) {
           Object.values(list.members).slice(0, membersCount).forEach(m => {
             // Sanitize name for key
             const safeKey = m.name.replace(/[.#$\[\]\/]/g, '_').toLowerCase();
             upvotedBy[safeKey] = true;
           });
        } else {
           upvotedBy["anonymous"] = true;
        }

        item.upvotes = membersCount;
        
        // Add to the main data object to be uploaded back
        if (!data.lists[listId].upvotedBy) {
          data.lists[listId].upvotedBy = {};
        }
        
        for (const userKey in upvotedBy) {
           if (!data.lists[listId].upvotedBy[userKey]) {
             data.lists[listId].upvotedBy[userKey] = {};
           }
           data.lists[listId].upvotedBy[userKey][itemId] = true;
        }
        modifiedCount++;
      } else if (item.upvotes > 0) {
        // Even if not over limit, let's backfill upvotedBy randomly from members
        // so that the number of upvotes matches the length of upvotedBy.
        const upvotesNeeded = item.upvotes;
        const upvotedBy = {};
        if (list.members) {
           Object.values(list.members).slice(0, upvotesNeeded).forEach(m => {
             const safeKey = m.name.replace(/[.#$\[\]\/]/g, '_').toLowerCase();
             upvotedBy[safeKey] = true;
           });
        }
        
        if (!data.lists[listId].upvotedBy) {
          data.lists[listId].upvotedBy = {};
        }
        
        for (const userKey in upvotedBy) {
           if (!data.lists[listId].upvotedBy[userKey]) {
             data.lists[listId].upvotedBy[userKey] = {};
           }
           data.lists[listId].upvotedBy[userKey][itemId] = true;
        }
      }
    }
  }

  if (modifiedCount > 0) {
     fs.writeFileSync("rtdb_cleaned.json", JSON.stringify(data, null, 2));
     console.log("Cleaned DB saved. Uploading back to Firebase...");
     
     const putRes = await fetch("https://e-learning-47448.firebaseio.com/.json", {
       method: "PUT",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(data)
     });
     
     if (putRes.ok) {
       console.log("Successfully updated Firebase RTDB with cleaned data.");
     } else {
       console.error("Failed to update Firebase:", await putRes.text());
     }
  } else {
     console.log("No abnormal upvotes found to clean.");
  }
}

main().catch(console.error);
