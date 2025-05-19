import fetch from "isomorphic-fetch";
import axios from "axios";
import fs from "fs";
import path from "path";

const defaultHeaders = {
  "sec-ch-ua":
    '"Google Chrome";v="87", " Not;A Brand";v="99", "Chromium";v="87"',
  "sec-ch-ua-mobile": "?0",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "x-ig-app-id": "936619743392459",
  "x-ig-www-claim": "hmac.AR0A6WzcCoXWstKAUuy1gRbCQFUs8FoZCp3ap2UMk_KQNBSH",
};

const getHeaders = (headers: any, sessionid: any, userid: any) => {
  return Object.assign(headers, {
    cookie: `sessionid=${sessionid}; ds_user_id=${userid}`,
  });
};

export const getUserByUsername = ({
  username,
  sessionid,
  userid,
  headers = defaultHeaders,
}: {
  username: string;
  sessionid: string;
  userid: string;
  headers?: any;
}) =>
  fetch(
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
    {
      headers: getHeaders(headers, sessionid, userid),
    }
  )
    .then((res: any) => res.json())
    .then(({ data }: any) => data);

export const getMediaByCode = ({
  code,
  sessionid,
  userid,
  headers = defaultHeaders,
}: {
  code: string;
  sessionid: string;
  userid: string;
  headers?: any;
}) =>
  fetch(`https://www.instagram.com/p/${code}/?__a=1`, {
    headers: getHeaders(headers, sessionid, userid),
  }).then((res: any) => res.json());

/**
 * Get stories of Instagram
 * @param id - account id for get stories
 * @param sessionid - value of cookies from Instagram
 * @param userid - me id
 * @param headers - headers
 * @returns stories
 */
export const getStories = ({
  id,
  sessionid,
  userid,
  headers = defaultHeaders,
}: {
  id: string;
  sessionid: string;
  userid: string;
  headers?: any;
}) =>
  fetch(`https://i.instagram.com/api/v1/feed/user/${id}/story/`, {
    headers: getHeaders(headers, sessionid, userid),
  })
    .then((res: any) => res.json())
    .then((res: any) => {
      const { status, reel } = res;

      return {
        status,
        items: reel ? reel.items : [],
      };
    });

export const getStoriesFeed = ({
  sessionid,
  userid,
  headers = defaultHeaders,
}: {
  sessionid: string;
  userid: string;
  headers?: any;
}) =>
  fetch(`https://i.instagram.com/api/v1/feed/reels_tray/`, {
    headers: getHeaders(headers, sessionid, userid),
  }).then((res: any) => res.json());

export const getMediaByLocation = ({
  id,
  sessionid,
  userid,
  headers = defaultHeaders,
}: {
  id: string;
  sessionid: string;
  userid: string;
  headers?: any;
}) =>
  fetch(`https://www.instagram.com/explore/locations/${id}/?__a=1`, {
    headers: getHeaders(headers, sessionid, userid),
  })
    .then((res: any) => res.json())
    .then(({ native_location_data: location }: any) => location);

export const getUserHighlights = ({
  id,
  sessionid,
  userid,
  headers = defaultHeaders,
}: {
  id: string;
  sessionid: string;
  userid: string;
  headers?: any;
}) =>
  fetch(`https://i.instagram.com/api/v1/highlights/${id}/highlights_tray/`, {
    headers: getHeaders(headers, sessionid, userid),
  }).then((res: any) => res.json());

export const getUsernameInfo = async ({
  username,
  sessionid,
}: {
  username: string;
  sessionid: string;
}) => {
  const url = `https://i.instagram.com/api/v1/users/usernameinfo/?username=${username}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Instagram 123.0.0.21.114", // Mobil uygulama gibi davranır
        Cookie: `sessionid=${sessionid}`,
      },
    });

    const user = response.data.user;
    console.log(`Username: ${user.username}`);
    console.log(`User ID : ${user.pk}`);
    return user.pk;
  } catch (error: any) {
    console.error(
      "Hata oluştu:",
      error.response?.data?.message || error.message
    );
    return null;
  }
};

/**
 * Downloads and saves a file from the given URL.
 * @param {string} url - The media URL to download
 * @param {string} filename - The filename to save as
 */
export async function downloadFile(
  url: string,
  filename: string,
  username: string
) {
  const downloadsDir = path.resolve(
    __dirname,
    "..",
    "downloads",
    username || "unknown"
  );

  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const writer = fs.createWriteStream(path.join(downloadsDir, filename));

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log("✔️ Downloaded:", filename);
      resolve(true);
    });
    writer.on("error", reject);
  });
}

export async function downloadStories(items: any) {
  for (const item of items) {
    const id = item.id;

    if (item.image_versions2) {
      const imageUrl = item.image_versions2.candidates[0].url;
      await downloadFile(imageUrl, `${id}.jpg`, item.user.username);
    } else {
      console.log("⏭️ Image not found:", id);
    }

    if (item.video_versions) {
      const videoUrl = item.video_versions[0].url;
      await downloadFile(videoUrl, `${id}.mp4`, item.user.username);
    } else {
      console.log("⏭️ Video not found:", id);
    }
  }
}
