namespace BusNavigate.Service.Implements.GtfsImport;

// Minimal RFC 4180 CSV reader (quoted fields, escaped "" quotes, comma-separated) —
// GTFS text files are plain CSV, no external parsing library needed for this shape.
internal sealed class CsvTable
{
    private readonly Dictionary<string, int> _columnIndex;
    private readonly List<string[]> _rows;

    private CsvTable(Dictionary<string, int> columnIndex, List<string[]> rows)
    {
        _columnIndex = columnIndex;
        _rows = rows;
    }

    public int RowCount => _rows.Count;

    public static CsvTable Parse(string csvText)
    {
        var lines = SplitLines(csvText);
        if (lines.Count == 0)
        {
            return new CsvTable(new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase), []);
        }

        var header = ParseLine(lines[0]);
        var columnIndex = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < header.Length; i++)
        {
            columnIndex[header[i].Trim()] = i;
        }

        var rows = new List<string[]>(lines.Count - 1);
        for (var i = 1; i < lines.Count; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i]))
            {
                continue;
            }

            rows.Add(ParseLine(lines[i]));
        }

        return new CsvTable(columnIndex, rows);
    }

    public string? Get(int rowIndex, string column)
    {
        var row = _rows[rowIndex];
        if (!_columnIndex.TryGetValue(column, out var index) || index >= row.Length)
        {
            return null;
        }

        var value = row[index].Trim();
        return value.Length == 0 ? null : value;
    }

    public bool HasColumn(string column) => _columnIndex.ContainsKey(column);

    private static List<string> SplitLines(string text)
    {
        return text
            .Replace("\r\n", "\n")
            .Replace("\r", "\n")
            .Split('\n')
            .Where(line => line.Length > 0)
            .ToList();
    }

    private static string[] ParseLine(string line)
    {
        var fields = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    current.Append(c);
                }

                continue;
            }

            switch (c)
            {
                case '"':
                    inQuotes = true;
                    break;
                case ',':
                    fields.Add(current.ToString());
                    current.Clear();
                    break;
                default:
                    current.Append(c);
                    break;
            }
        }

        fields.Add(current.ToString());
        return [.. fields];
    }
}
