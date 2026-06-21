import { LocationError, LocationErrorCode } from './errors.js';

export class Coordinate {
  constructor(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new LocationError(LocationErrorCode.INVALID_COORDINATES, 'Coordinates must be finite numbers', 400);
    }
    if (latitude < -90 || latitude > 90) {
      throw new LocationError(LocationErrorCode.INVALID_COORDINATES, 'Latitude out of range -90 to 90', 400);
    }
    if (longitude < -180 || longitude > 180) {
      throw new LocationError(LocationErrorCode.INVALID_COORDINATES, 'Longitude out of range -180 to 180', 400);
    }

    this.latitude = latitude;
    this.longitude = longitude;
    Object.freeze(this);
  }

  toJSON() {
    return { latitude: this.latitude, longitude: this.longitude };
  }

  toString() {
    return `${this.latitude},${this.longitude}`;
  }

  toArray() {
    return [this.longitude, this.latitude];
  }

  equals(other) {
    if (!(other instanceof Coordinate)) return false;
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }
}
