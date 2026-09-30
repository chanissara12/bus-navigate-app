namespace BusNavigate.Domain.Entities;

// One point of a StopLandmark's real OSM way geometry (e.g. a footbridge's actual
// path) — only populated for landmarks sourced from a way (Skywalk); a point
// landmark (Crossing, MallEntrance) has an empty list.
public record LandmarkGeometryPoint(decimal Latitude, decimal Longitude);
