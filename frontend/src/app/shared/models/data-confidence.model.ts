// Mirrors backend/BusNavigate.Domain/Entities/DataConfidence.cs — numeric values
// matter, System.Text.Json serializes the enum as a number, not a string.
export enum DataConfidence {
    Realtime = 0,
    Estimated = 1,
    Scheduled = 2,
    Unknown = 3
}
