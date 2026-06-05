namespace Homiee.Modules.Catalog.Application.Helpers
{
    public static class GeoHelper
    {
        private const double EarthRadiusKm = 6371.0;

        /// <summary>
        /// Haversine formula — returns distance in kilometres between two lat/lng points.
        /// </summary>
        public static double DistanceKm(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = ToRad(lat2 - lat1);
            var dLon = ToRad(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                  + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
                  * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c;
        }

        /// <summary>
        /// Returns a bounding-box (lat/lng min/max) for a given centre + radius in km.
        /// Use this to pre-filter with SQL before running exact Haversine in memory.
        /// </summary>
        public static (double MinLat, double MaxLat, double MinLon, double MaxLon)
            BoundingBox(double lat, double lon, double radiusKm)
        {
            var latDelta = radiusKm / EarthRadiusKm * (180 / Math.PI);
            var lonDelta = radiusKm / (EarthRadiusKm * Math.Cos(ToRad(lat))) * (180 / Math.PI);
            return (lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta);
        }

        private static double ToRad(double deg) => deg * Math.PI / 180.0;
    }
}