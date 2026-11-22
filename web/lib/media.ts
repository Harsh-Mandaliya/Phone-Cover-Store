// Lifestyle photos from Pexels (free for commercial use, no attribution required — https://www.pexels.com/license/).
// Swap these for your own shoot any time; anything served over https works.
const px = (path: string, w = 1400) => `https://images.pexels.com/photos/${path}?auto=compress&cs=tinysrgb&w=${w}`;

export const MEDIA = {
  hero: px('3765164/pexels-photo-3765164.jpeg'), // smiling woman with her phone on a light-blue wall
  heroProduct: px('696645/pexels-photo-696645.jpeg', 400),
  protection: px('6612384/pexels-photo-6612384.jpeg', 1200), // hand holding a phone on blue-gray
  findFit: px('13469804/pexels-photo-13469804.jpeg', 1000),
};
