import { downloadStories, getStories } from "./utils";

(async () => {
  const targetUserId = "***";
  const myId = "***";
  const sessionId = "***";

  const stories = await getStories({
    id: targetUserId,
    sessionid: sessionId,
    userid: myId,
  });

  console.log("stories: ", stories);

  await downloadStories(stories.items);
})();
