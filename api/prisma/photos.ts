/* Free-licence product photos from Pexels (https://www.pexels.com/license/ — free for commercial use,
 * no attribution required). Loaded from Pexels' CDN at the right size. Replace any of them with your
 * own product shots from Admin → Products → Edit → Photos (uploads always take priority). */
const px = (path: string, w = 900) => `https://images.pexels.com/photos/${path}?auto=compress&cs=tinysrgb&w=${w}`;

export const PRODUCT_PHOTOS: Record<string, string[]> = {
  'Armour Pro MagSafe Case': [px('696645/pexels-photo-696645.jpeg'), px('13469804/pexels-photo-13469804.jpeg')],
  'Crystal Clear MagSafe Case': [px('7360460/pexels-photo-7360460.jpeg'), px('34391718/pexels-photo-34391718/free-photo-of-modern-smartphone-with-clear-case-on-wooden-table.jpeg')],
  'Silicone Soft Touch Case': [px('1670768/pexels-photo-1670768.jpeg'), px('9558782/pexels-photo-9558782.jpeg')],
  'Marble Luxe Glass Case': [px('374140/pexels-photo-374140.jpeg'), px('374117/pexels-photo-374117.jpeg')],
  'Leather Folio Wallet Case': [px('8156983/pexels-photo-8156983.jpeg'), px('13706809/pexels-photo-13706809.jpeg')],
  'Titan Rugged Armour Case': [px('19784109/pexels-photo-19784109/free-photo-of-smartphone-in-case.jpeg')],
  'Dot Grid Matte Case': [px('7742554/pexels-photo-7742554.jpeg'), px('7742552/pexels-photo-7742552.jpeg')],
  'Galaxy Armour Pro Case': [px('20718273/pexels-photo-20718273/free-photo-of-smartphone-in-black-case-in-hand.jpeg'), px('18388131/pexels-photo-18388131/free-photo-of-man-hands-holding-smartphone.jpeg')],
  'Galaxy Clear Slim Case': [px('7742503/pexels-photo-7742503.jpeg')],
  'Fold & Flip Hinge Shield': [px('9558788/pexels-photo-9558788.jpeg'), px('8473458/pexels-photo-8473458.jpeg')],
  'Galaxy Silicone Grip Case': [px('17077359/pexels-photo-17077359/free-photo-of-smart-phone-silicons-case.jpeg'), px('12359130/pexels-photo-12359130.jpeg')],
  '9H Edge-to-Edge Tempered Glass': [px('7742506/pexels-photo-7742506.jpeg'), px('7742507/pexels-photo-7742507.jpeg')],
  'Privacy Anti-Spy Glass': [px('7742507/pexels-photo-7742507.jpeg'), px('13570135/pexels-photo-13570135.jpeg')],
  'Camera Lens Protector Rings': [px('4574587/pexels-photo-4574587.jpeg'), px('16389484/pexels-photo-16389484/free-photo-of-close-up-of-cellphone-camera.jpeg')],
  'Matte Anti-Glare Glass': [px('3619858/pexels-photo-3619858.jpeg')],
  'Alpine Loop Watch Strap': [px('13610157/pexels-photo-13610157.jpeg'), px('38919178/pexels-photo-38919178/free-photo-of-elegant-smartwatch-on-wooden-surface.jpeg')],
  'Sport Silicone Band': [px('10357003/pexels-photo-10357003.jpeg'), px('11031515/pexels-photo-11031515.png')],
  'Milanese Steel Loop': [px('12307366/pexels-photo-12307366.jpeg')],
  'Rugged Bumper Case for Watch': [px('11617965/pexels-photo-11617965.jpeg')],
  'Armour AirPods Pro Case': [px('3921872/pexels-photo-3921872.jpeg'), px('3921864/pexels-photo-3921864.jpeg')],
  'Silicone AirPods Skin': [px('3921830/pexels-photo-3921830.jpeg'), px('3921827/pexels-photo-3921827.jpeg')],
  'Leather AirPods Pouch': [px('3921838/pexels-photo-3921838.jpeg')],
  '15W MagSafe Wireless Charger': [px('5961044/pexels-photo-5961044.jpeg'), px('5083410/pexels-photo-5083410.jpeg')],
  '3-in-1 Foldable Charging Stand': [px('5083491/pexels-photo-5083491.jpeg'), px('7742585/pexels-photo-7742585.jpeg')],
  '35W Dual USB-C GaN Adapter': [px('3921696/pexels-photo-3921696.jpeg'), px('3921632/pexels-photo-3921632.jpeg')],
  'MagSafe Card Wallet': [px('13706809/pexels-photo-13706809.jpeg')],
  '10000mAh Magnetic Power Bank': [px('14706040/pexels-photo-14706040.jpeg'), px('10104285/pexels-photo-10104285.jpeg')],
  '20000mAh Travel Power Bank': [px('11031423/pexels-photo-11031423.png'), px('3921695/pexels-photo-3921695.jpeg')],
  'Braided USB-C to USB-C Cable 2m': [px('3921633/pexels-photo-3921633.jpeg'), px('3921711/pexels-photo-3921711.jpeg')],
  'USB-C to Lightning Cable 1m': [px('4072683/pexels-photo-4072683.jpeg'), px('1028674/pexels-photo-1028674.jpeg')],
};

export const CATEGORY_PHOTOS: Record<string, string> = {
  'iphone-cases': px('374117/pexels-photo-374117.jpeg', 1200),
  'samsung-cases': px('12359130/pexels-photo-12359130.jpeg'),
  protectors: px('7742506/pexels-photo-7742506.jpeg'),
  'watch-straps': px('38919178/pexels-photo-38919178/free-photo-of-elegant-smartwatch-on-wooden-surface.jpeg', 1200),
  'airpods-cases': px('3921817/pexels-photo-3921817.jpeg'),
  'magsafe-chargers': px('5083490/pexels-photo-5083490.jpeg'),
  'power-cables': px('3921695/pexels-photo-3921695.jpeg'),
};
