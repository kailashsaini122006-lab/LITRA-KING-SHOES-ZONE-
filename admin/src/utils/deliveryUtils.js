/**
 * Litra King Shoes Zone - Distance & Delivery Charge Utility
 * Single Configurable Shop Location: Main Footwear Market, Chomu, Rajasthan 303702
 * Coordinates: Latitude 27.1787383, Longitude 75.719
 */

export const SHOP_LOCATION = {
  name: 'LITRA KING (SHOES ZONE)',
  address: 'Main Footwear Market, Chomu, Rajasthan, 303702',
  lat: 27.1787383,
  lng: 75.719,
  pincode: '303702',
};

export function calculateDeliveryChargeFromDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm) || distanceKm < 0) {
    return null;
  }

  const dist = Number(distanceKm);
  if (dist <= 5) return 49;
  if (dist <= 10) return 69;
  if (dist <= 20) return 99;
  if (dist <= 30) return 149;
  if (dist <= 40) return 199;
  if (dist <= 50) return 249;
  if (dist <= 75) return 349;
  if (dist <= 100) return 449;
  return 499;
}

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return 0;
  }

  const R = 6371;
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;
  return Math.round(straightDistance * 10) / 10;
}

const KNOWN_PINCODES = {
  '303702': { lat: 27.1787383, lng: 75.719, place: 'Chomu Main Market' },
  '303708': { lat: 27.1600, lng: 75.7300, place: 'Radhaswamibagh / Tankarda, Chomu' },
  '303706': { lat: 27.1900, lng: 75.7900, place: 'Morija, Chomu' },
  '303704': { lat: 27.2100, lng: 75.8000, place: 'Samod' },
  '303701': { lat: 27.2400, lng: 75.7500, place: 'Govindgarh' },
  '303712': { lat: 27.1400, lng: 75.5600, place: 'Kaladera' },
  '303713': { lat: 27.2800, lng: 75.6800, place: 'Nangal Koju' },
  '303603': { lat: 27.3600, lng: 75.5700, place: 'Reengus' },
  '303703': { lat: 27.0100, lng: 75.8500, place: 'Amer / Kukas' },
  '302039': { lat: 26.9800, lng: 75.7600, place: 'Harmada, Jaipur' },
  '302013': { lat: 26.9600, lng: 75.7800, place: 'Vidyadhar Nagar, Jaipur' },
  '302012': { lat: 26.9400, lng: 75.7600, place: 'Jhotwara, Jaipur' },
  '302001': { lat: 26.9200, lng: 75.8200, place: 'Jaipur GPO / City Center' },
  '302016': { lat: 26.9100, lng: 75.7400, place: 'Vaishali Nagar, Jaipur' },
  '302018': { lat: 26.8800, lng: 75.7900, place: 'Gopalpura, Jaipur' },
  '302020': { lat: 26.8600, lng: 75.7600, place: 'Mansarovar, Jaipur' },
  '302021': { lat: 26.8900, lng: 75.7300, place: 'Ajmer Road, Jaipur' },
  '302017': { lat: 26.8500, lng: 75.8100, place: 'Malviya Nagar, Jaipur' },
  '302022': { lat: 26.8100, lng: 75.8000, place: 'Sanganer, Jaipur' },
  '302033': { lat: 26.7900, lng: 75.8200, place: 'Pratap Nagar, Jaipur' },
  '332001': { lat: 27.6100, lng: 75.1400, place: 'Sikar' },
  '333001': { lat: 28.1200, lng: 75.3900, place: 'Jhunjhunu' },
  '305001': { lat: 26.4500, lng: 74.6400, place: 'Ajmer' },
  '342001': { lat: 26.2900, lng: 73.0200, place: 'Jodhpur' },
  '313001': { lat: 24.5800, lng: 73.7100, place: 'Udaipur' },
  '324001': { lat: 25.2100, lng: 75.8600, place: 'Kota' },
  '334001': { lat: 28.0200, lng: 73.3100, place: 'Bikaner' },
  '110001': { lat: 28.6300, lng: 77.2200, place: 'New Delhi' },
  '122001': { lat: 28.4600, lng: 77.0300, place: 'Gurugram' },
  '201301': { lat: 28.5300, lng: 77.3900, place: 'Noida' },
  '400001': { lat: 18.9300, lng: 72.8300, place: 'Mumbai' },
};

export async function calculateCustomerDeliveryDistance({ pincode, lat, lng }) {
  if (lat !== undefined && lat !== null && !isNaN(Number(lat)) && lng !== undefined && lng !== null && !isNaN(Number(lng))) {
    const customerLat = Number(lat);
    const customerLng = Number(lng);
    const distKm = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, customerLat, customerLng);
    const charge = calculateDeliveryChargeFromDistance(distKm);
    return {
      success: true,
      distanceKm: distKm,
      deliveryCharge: charge,
      method: `GPS Location (${distKm} km from LITRA KING)`,
      isGps: true,
    };
  }

  const cleanPincode = (pincode || '').toString().trim().replace(/\D/g, '');
  if (cleanPincode.length === 6) {
    if (KNOWN_PINCODES[cleanPincode]) {
      const target = KNOWN_PINCODES[cleanPincode];
      const distKm = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, target.lat, target.lng);
      const charge = calculateDeliveryChargeFromDistance(distKm);
      return {
        success: true,
        distanceKm: distKm,
        deliveryCharge: charge,
        method: `PIN Code ${cleanPincode} (${target.place} - ${distKm} km)`,
        isGps: false,
      };
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${cleanPincode}&country=India&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'LitraKingShoesZone/1.0 (DeliveryDistanceApp)',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const destLat = parseFloat(data[0].lat);
          const destLng = parseFloat(data[0].lon);
          const distKm = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, destLat, destLng);
          const charge = calculateDeliveryChargeFromDistance(distKm);
          return {
            success: true,
            distanceKm: distKm,
            deliveryCharge: charge,
            method: `PIN Code ${cleanPincode} (${distKm} km)`,
            isGps: false,
          };
        }
      }
    } catch (err) {
      console.warn('Nominatim lookup note:', err.message);
    }

    try {
      const zipRes = await fetch(`https://api.zippopotam.us/in/${cleanPincode}`);
      if (zipRes.ok) {
        const zipData = await zipRes.json();
        if (zipData && Array.isArray(zipData.places) && zipData.places.length > 0) {
          const place = zipData.places[0];
          if (place.latitude && place.longitude) {
            const destLat = parseFloat(place.latitude);
            const destLng = parseFloat(place.longitude);
            const distKm = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, destLat, destLng);
            const charge = calculateDeliveryChargeFromDistance(distKm);
            return {
              success: true,
              distanceKm: distKm,
              deliveryCharge: charge,
              method: `PIN Code ${cleanPincode} (${place['place name'] || 'Local Area'} - ${distKm} km)`,
              isGps: false,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Zippopotam lookup note:', err.message);
    }

    return {
      success: false,
      distanceKm: null,
      deliveryCharge: null,
      message: 'Pincode location not found. Please verify your Pincode or click "Use My Current Location".',
      isGps: false,
    };
  }

  return {
    success: false,
    distanceKm: null,
    deliveryCharge: null,
    message: 'Please enter a valid 6-digit PIN Code or click "Use My Current Location".',
    isGps: false,
  };
}
