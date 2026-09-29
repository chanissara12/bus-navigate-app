namespace BusNavigate.Domain.Helpers;

// Straight-line (haversine) distance — Phase 1 has no turn-by-turn WalkingRoute or
// routing graph (see CONTEXT.md's "Out of scope" list), so this is the only walking
// distance estimate available. Shared across any feature that needs a walk-distance
// estimate (T05's comparison algorithm, later T06/T08).
public static class GeoDistanceHelper
{
    private const double EarthRadiusMeters = 6371000;

    public static double HaversineDistanceMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        var phi1 = ToRadians((double)lat1);
        var phi2 = ToRadians((double)lat2);
        var deltaPhi = ToRadians((double)(lat2 - lat1));
        var deltaLambda = ToRadians((double)(lon2 - lon1));

        var a = (Math.Sin(deltaPhi / 2) * Math.Sin(deltaPhi / 2)) +
                (Math.Cos(phi1) * Math.Cos(phi2) * Math.Sin(deltaLambda / 2) * Math.Sin(deltaLambda / 2));
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusMeters * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
