using System.Globalization;

namespace BusNavigate.Service.Implements.GtfsImport;

internal static class RouteShapeParser
{
    private const double SimplificationToleranceMeters = 15;

    public static Dictionary<string, List<(decimal Latitude, decimal Longitude)>> Parse(
        string shapesCsv, IReadOnlySet<string> selectedShapeIds)
    {
        var pointsByShape = new Dictionary<string, List<(decimal Latitude, decimal Longitude)>>(StringComparer.Ordinal);

        using var reader = new StringReader(shapesCsv);
        var header = ReadCsvLine(reader);
        if (header is null)
        {
            return pointsByShape;
        }

        var headerIndex = BuildHeaderIndex(header);
        if (!headerIndex.TryGetValue("shape_id", out var shapeIdIndex) ||
            !headerIndex.TryGetValue("shape_pt_lat", out var latitudeIndex) ||
            !headerIndex.TryGetValue("shape_pt_lon", out var longitudeIndex) ||
            !headerIndex.TryGetValue("shape_pt_sequence", out var sequenceIndex))
        {
            throw new InvalidOperationException("GTFS shapes.txt is missing required shape columns.");
        }

        var rows = new List<(string ShapeId, int Sequence, decimal Latitude, decimal Longitude)>();

        while (reader.ReadLine() is { } line)
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var fields = ParseCsvLine(line);
            if (shapeIdIndex >= fields.Count || !selectedShapeIds.Contains(fields[shapeIdIndex]))
            {
                continue;
            }

            if (!decimal.TryParse(fields[latitudeIndex], NumberStyles.Float, CultureInfo.InvariantCulture, out var latitude) ||
                !decimal.TryParse(fields[longitudeIndex], NumberStyles.Float, CultureInfo.InvariantCulture, out var longitude) ||
                !int.TryParse(fields[sequenceIndex], NumberStyles.Integer, CultureInfo.InvariantCulture, out var sequence))
            {
                continue;
            }

            rows.Add((fields[shapeIdIndex], sequence, latitude, longitude));
        }

        foreach (var group in rows.GroupBy(row => row.ShapeId, StringComparer.Ordinal))
        {
            var ordered = group
                .OrderBy(row => row.Sequence)
                .Select(row => (row.Latitude, row.Longitude))
                .ToList();

            pointsByShape[group.Key] = Simplify(ordered);
        }

        return pointsByShape;
    }

    public static Dictionary<string, string?> GetMostCommonShapeIdByDirection(IReadOnlyList<GtfsTrip> trips)
    {
        return trips
            .GroupBy(trip => (trip.RouteId, trip.DirectionId))
            .ToDictionary(
                group => $"{group.Key.RouteId}-{group.Key.DirectionId}",
                group => group
                    .Where(trip => !string.IsNullOrWhiteSpace(trip.ShapeId))
                    .GroupBy(trip => trip.ShapeId!, StringComparer.Ordinal)
                    .OrderByDescending(shape => shape.Count())
                    .Select(shape => shape.Key)
                    .FirstOrDefault(),
                StringComparer.Ordinal);
    }

    private static List<(decimal Latitude, decimal Longitude)> Simplify(
        List<(decimal Latitude, decimal Longitude)> points)
    {
        if (points.Count <= 2)
        {
            return points;
        }

        var keep = new bool[points.Count];
        keep[0] = true;
        keep[^1] = true;

        SimplifyRange(points, keep, 0, points.Count - 1);

        var result = new List<(decimal Latitude, decimal Longitude)>();
        for (var i = 0; i < points.Count; i++)
        {
            if (keep[i])
            {
                result.Add(points[i]);
            }
        }

        return result;
    }

    private static void SimplifyRange(
        IReadOnlyList<(decimal Latitude, decimal Longitude)> points,
        bool[] keep,
        int start,
        int end)
    {
        if (end <= start + 1)
        {
            return;
        }

        var maxDistance = 0d;
        var maxIndex = -1;
        for (var i = start + 1; i < end; i++)
        {
            var distance = PerpendicularDistanceMeters(points[i], points[start], points[end]);
            if (distance > maxDistance)
            {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        if (maxDistance <= SimplificationToleranceMeters || maxIndex < 0)
        {
            return;
        }

        keep[maxIndex] = true;
        SimplifyRange(points, keep, start, maxIndex);
        SimplifyRange(points, keep, maxIndex, end);
    }

    private static double PerpendicularDistanceMeters(
        (decimal Latitude, decimal Longitude) point,
        (decimal Latitude, decimal Longitude) start,
        (decimal Latitude, decimal Longitude) end)
    {
        var referenceLatitude = (double)(start.Latitude + end.Latitude + point.Latitude) / 3;
        var cosLatitude = Math.Cos(referenceLatitude * Math.PI / 180);
        var scaleX = 111_320d * cosLatitude;
        var scaleY = 110_540d;

        var px = (double)(point.Longitude - start.Longitude) * scaleX;
        var py = (double)(point.Latitude - start.Latitude) * scaleY;
        var ex = (double)(end.Longitude - start.Longitude) * scaleX;
        var ey = (double)(end.Latitude - start.Latitude) * scaleY;

        var lengthSquared = ex * ex + ey * ey;
        if (lengthSquared == 0)
        {
            return Math.Sqrt(px * px + py * py);
        }

        var projection = Math.Clamp((px * ex + py * ey) / lengthSquared, 0, 1);
        var dx = px - projection * ex;
        var dy = py - projection * ey;
        return Math.Sqrt(dx * dx + dy * dy);
    }

    private static Dictionary<string, int> BuildHeaderIndex(IReadOnlyList<string> header)
    {
        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < header.Count; i++)
        {
            result[header[i].Trim()] = i;
        }

        return result;
    }

    private static List<string>? ReadCsvLine(StringReader reader)
    {
        var line = reader.ReadLine();
        return line is null ? null : ParseCsvLine(line);
    }

    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var current = new System.Text.StringBuilder();
        var quoted = false;

        foreach (var character in line)
        {
            if (character == '"')
            {
                quoted = !quoted;
                continue;
            }

            if (character == ',' && !quoted)
            {
                fields.Add(current.ToString().Trim());
                current.Clear();
                continue;
            }

            current.Append(character);
        }

        fields.Add(current.ToString().Trim());
        return fields;
    }
}
