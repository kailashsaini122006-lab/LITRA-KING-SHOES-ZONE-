/**
 * Litra King Shoes Zone - Distance & Delivery Charge Utility
 * Single Configurable Shop Location: Main Footwear Market, Chomu, Rajasthan 303702
 * Coordinates: Latitude 27.1704, Longitude 75.7225
 */

export const SHOP_LOCATION = {
  name: 'LITRA KING (SHOES ZONE)',
  address: 'Main Footwear Market, Chomu, Rajasthan, 303702',
  lat: 27.1704,
  lng: 75.7225,
  pincode: '303702',
};

/**
 * Delivery Charge Slabs based on Distance in kilometers:
 * 0 km to 5 km = ₹49
 * More than 5 km to 10 km = ₹69
 * More than 10 km to 20 km = ₹99
 * More than 20 km to 30 km = ₹149
 * More than 30 km to 40 km = ₹199
 * More than 40 km to 50 km = ₹249
 * More than 50 km to 75 km = ₹349
 * More than 75 km to 100 km = ₹449
 * More than 100 km = ₹499
 */
export function calculateDeliveryChargeFromDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm) || distanceKm < 0) {
    return null; // Return null if distance is not calculated yet
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

/**
 * Calculate Great Circle (Haversine) straight-line distance in kilometers between two lat/lng coordinates
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return 0;
  }

  const R = 6371; // Earth radius in kilometers
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

// Fast coordinate database for Indian PIN codes
const KNOWN_PINCODES = {
  // Chomu local & immediate surroundings (0-10 km)
  '303702': { lat: 27.1704, lng: 75.7225, place: 'Chomu Main Market' },
  '303708': { lat: 27.1600, lng: 75.7300, place: 'Radhaswamibagh / Tankarda, Chomu' },
  '303706': { lat: 27.1900, lng: 75.7900, place: 'Morija, Chomu' },
  '303704': { lat: 27.2100, lng: 75.8000, place: 'Samod' },
  '303701': { lat: 27.2400, lng: 75.7500, place: 'Govindgarh' },
  '303712': { lat: 27.1400, lng: 75.5600, place: 'Kaladera' },
  '303713': { lat: 27.2800, lng: 75.6800, place: 'Nangal Koju' },
  '303603': { lat: 27.3600, lng: 75.5700, place: 'Reengus' },
  '303703': { lat: 27.0100, lng: 75.8500, place: 'Amer / Kukas' },

  // Jaipur City & Outskirts (15-45 km)
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

  // Regional Rajasthan Cities
  '332001': { lat: 27.6100, lng: 75.1400, place: 'Sikar' },
  '333001': { lat: 28.1200, lng: 75.3900, place: 'Jhunjhunu' },
  '305001': { lat: 26.4500, lng: 74.6400, place: 'Ajmer' },
  '342001': { lat: 26.2900, lng: 73.0200, place: 'Jodhpur' },
  '313001': { lat: 24.5800, lng: 73.7100, place: 'Udaipur' },
  '324001': { lat: 25.2100, lng: 75.8600, place: 'Kota' },
  '334001': { lat: 28.0200, lng: 73.3100, place: 'Bikaner' },

  // Major NCR / National Cities
  '110001': { lat: 28.6300, lng: 77.2200, place: 'New Delhi' },
  '122001': { lat: 28.4600, lng: 77.0300, place: 'Gurugram' },
  '201301': { lat: 28.5300, lng: 77.3900, place: 'Noida' },
  '400001': { lat: 18.9300, lng: 72.8300, place: 'Mumbai' },
};

/**
 * Calculate distance from LITRA KING shop to customer delivery location
 * Priority 1: Customer GPS coordinates (latitude, longitude)
 * Priority 2: Customer 6-digit PIN code
 */
export async function calculateCustomerDeliveryDistance({ pincode, lat, lng }) {
  // Priority 1: Exact Customer GPS coordinates
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

  // Priority 2: Customer 6-digit PIN Code Fallback
  const cleanPincode = (pincode || '').toString().trim().replace(/\D/g, '');
  if (cleanPincode.length === 6) {
    // 2a. Check fast internal coordinate database
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

    // 2b. Geocoding Service 1: Nominatim OpenStreetMap (with User-Agent header)
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

    // 2c. Geocoding Service 2: Zippopotam.us IN API
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

    // 2d. Geocoding Service 3: India Post PIN Code API + Nominatim place search
    try {
      const postRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
      if (postRes.ok) {
        const postData = await postRes.json();
        if (Array.isArray(postData) && postData[0]?.Status === 'Success' && Array.isArray(postData[0]?.PostOffice) && postData[0].PostOffice.length > 0) {
          const po = postData[0].PostOffice[0];
          const searchLocation = `${po.District || po.Division || po.Block || ''}, ${po.State || 'Rajasthan'}, India`;
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLocation)}&format=json&limit=1`,
            {
              headers: {
                'User-Agent': 'LitraKingShoesZone/1.0 (DeliveryDistanceApp)',
              },
            }
          );
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (Array.isArray(nomData) && nomData.length > 0 && nomData[0].lat && nomData[0].lon) {
              const destLat = parseFloat(nomData[0].lat);
              const destLng = parseFloat(nomData[0].lon);
              const distKm = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, destLat, destLng);
              const charge = calculateDeliveryChargeFromDistance(distKm);
              return {
                success: true,
                distanceKm: distKm,
                deliveryCharge: charge,
                method: `PIN Code ${cleanPincode} (${po.District || 'Area'} - ${distKm} km)`,
                isGps: false,
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('India Post API lookup note:', err.message);
    }

    // 2e. Regional PIN Prefix Fallback (only when external APIs are completely unreachable)
    let distKm = 350.0;
    let areaName = 'National Delivery';

    if (cleanPincode === '303702') {
      distKm = 2.5;
      areaName = 'Chomu Local PIN';
    } else if (cleanPincode.startsWith('3037')) {
      distKm = 8.5;
      areaName = 'Govindgarh / Samod / Local Chomu Tehsil Area';
    } else if (cleanPincode.startsWith('302039')) {
      distKm = 18.5;
      areaName = 'Harmada / Chomu Border Zone';
    } else if (cleanPincode.startsWith('302012') || cleanPincode.startsWith('302013')) {
      distKm = 25.0;
      areaName = 'North Jaipur Zone';
    } else if (cleanPincode.startsWith('302')) {
      distKm = 33.0;
      areaName = 'Jaipur City Region';
    } else if (cleanPincode.startsWith('303')) {
      distKm = 28.0;
      areaName = 'Jaipur District Outskirts';
    } else if (cleanPincode.startsWith('332')) {
      distKm = 75.0;
      areaName = 'Sikar Region';
    } else if (
      cleanPincode.startsWith('30') ||
      cleanPincode.startsWith('31') ||
      cleanPincode.startsWith('32') ||
      cleanPincode.startsWith('33') ||
      cleanPincode.startsWith('34')
    ) {
      distKm = 145.0;
      areaName = 'Rajasthan State';
    } else {
      distKm = 350.0;
      areaName = 'National Delivery';
    }

    const charge = calculateDeliveryChargeFromDistance(distKm);
    return {
      success: true,
      distanceKm: distKm,
      deliveryCharge: charge,
      method: `PIN Code ${cleanPincode} (${areaName} - ${distKm} km)`,
      isGps: false,
    };
  }

  // Priority 3: Neither valid GPS nor valid 6-digit PIN code
  return {
    success: false,
    distanceKm: null,
    deliveryCharge: null,
    message: 'Please enter a valid 6-digit PIN Code or click "Use My Current Location".',
    isGps: false,
  };
}

