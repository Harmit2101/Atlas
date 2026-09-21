import * as THREE from 'three';

/**
 * Converts latitude and longitude coordinates into a 3D Cartesian Vector3 on a sphere.
 * 
 * @param lat Latitude in degrees (-90 to 90)
 * @param lon Longitude in degrees (-180 to 180)
 * @param radius Radius of the sphere
 */
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Converts a 3D Cartesian Vector3 on a sphere into latitude and longitude coordinates in degrees.
 * 
 * @param v Cartesian Vector3
 * @param radius Radius of the sphere
 */
export function vector3ToLatLon(v: THREE.Vector3, radius: number): { lat: number; lon: number } {
  const phi = Math.acos(Math.min(Math.max(v.y / radius, -1), 1));
  const lat = 90 - (phi * 180 / Math.PI);
  let theta = Math.atan2(v.z, -v.x);
  if (theta < 0) theta += 2 * Math.PI;
  const lon = (theta * 180 / Math.PI) - 180;
  return { lat, lon };
}
