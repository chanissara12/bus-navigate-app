namespace BusNavigate.Domain.Constants;

public static class StopLandmarkConstants
{
    // A landmark farther than this from every BusStop isn't associated with any of
    // them — chosen as a tight "at the stop" radius, distinct from T05/T06's 800m
    // walk budget (that's "how far can I walk to catch a bus," this is "is this
    // landmark actually at this specific stop").
    public const double MaxAssociationDistanceMeters = 300;
}
