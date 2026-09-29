using BusNavigate.Domain.Entities;

namespace BusNavigate.Service.Implements.BusStop;

// Parsed Overpass API element — internal to the sync pipeline, mirrors GtfsRecords'
// role for the GTFS import pipeline.
public record OverpassLandmark(
    string ExternalOsmId,
    decimal Latitude,
    decimal Longitude,
    LandmarkType LandmarkType,
    string NameTh,
    string NameEn,
    string? Description
);
