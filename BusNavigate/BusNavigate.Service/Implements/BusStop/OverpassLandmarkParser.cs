using System.Text.Json;
using BusNavigate.Domain.Entities;

namespace BusNavigate.Service.Implements.BusStop;

// Pure parsing: takes raw Overpass API JSON text, returns typed records. No I/O.
public static class OverpassLandmarkParser
{
    public static List<OverpassLandmark> Parse(string json)
    {
        var result = new List<OverpassLandmark>();

        using var document = JsonDocument.Parse(json);
        if (!document.RootElement.TryGetProperty("elements", out var elements))
        {
            return result;
        }

        foreach (var element in elements.EnumerateArray())
        {
            if (!TryGetCoordinates(element, out var lat, out var lon))
            {
                continue;
            }

            if (!element.TryGetProperty("type", out var typeProperty) ||
                !element.TryGetProperty("id", out var idProperty))
            {
                continue;
            }

            var externalOsmId = $"{typeProperty.GetString()}/{idProperty.GetInt64()}";
            var tags = ReadTags(element);

            var (landmarkType, description) = ClassifyTags(tags);
            var nameTh = tags.GetValueOrDefault("name:th") ?? tags.GetValueOrDefault("name") ?? string.Empty;
            var nameEn = tags.GetValueOrDefault("name:en") ?? tags.GetValueOrDefault("name") ?? string.Empty;

            result.Add(new OverpassLandmark(externalOsmId, lat, lon, landmarkType, nameTh, nameEn, description));
        }

        return result;
    }

    // Nodes carry lat/lon directly; ways/relations only carry a "center" point
    // (requires the Overpass query to include "out center;").
    private static bool TryGetCoordinates(JsonElement element, out decimal latitude, out decimal longitude)
    {
        if (element.TryGetProperty("lat", out var latProperty) && element.TryGetProperty("lon", out var lonProperty))
        {
            latitude = latProperty.GetDecimal();
            longitude = lonProperty.GetDecimal();
            return true;
        }

        if (element.TryGetProperty("center", out var centerProperty) &&
            centerProperty.TryGetProperty("lat", out var centerLat) &&
            centerProperty.TryGetProperty("lon", out var centerLon))
        {
            latitude = centerLat.GetDecimal();
            longitude = centerLon.GetDecimal();
            return true;
        }

        latitude = 0;
        longitude = 0;
        return false;
    }

    private static Dictionary<string, string> ReadTags(JsonElement element)
    {
        if (!element.TryGetProperty("tags", out var tagsProperty))
        {
            return [];
        }

        return tagsProperty.EnumerateObject().ToDictionary(p => p.Name, p => p.Value.GetString() ?? string.Empty);
    }

    // Best-effort mapping from common OSM tags to LandmarkType — unverified against
    // real Overpass output (no network access in this session); revisit once live
    // data is available. Anything unmatched falls back to Landmark with the raw tag
    // preserved in Description, per T08's "never silently dropped for not fitting the
    // enum" requirement.
    private static (LandmarkType Type, string? Description) ClassifyTags(Dictionary<string, string> tags)
    {
        if (tags.GetValueOrDefault("highway") == "crossing")
        {
            return (LandmarkType.Crossing, null);
        }

        if (tags.GetValueOrDefault("railway") == "station")
        {
            return (LandmarkType.TransitStationPointer, null);
        }

        if (tags.ContainsKey("entrance"))
        {
            return (LandmarkType.MallEntrance, null);
        }

        if (tags.GetValueOrDefault("highway") == "footway" && tags.GetValueOrDefault("bridge") == "yes")
        {
            return (LandmarkType.Skywalk, null);
        }

        var fallbackDescription = tags.TryGetValue("amenity", out var amenity)
            ? $"amenity={amenity}"
            : tags.TryGetValue("shop", out var shop) ? $"shop={shop}" : null;

        return (LandmarkType.Landmark, fallbackDescription);
    }
}
