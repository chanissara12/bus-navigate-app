namespace BusNavigate.Domain.Interfaces.BusStop;

// Downloads raw Overpass API JSON covering the area of all known BusStops in one
// batched query (the concrete implementation decides how to batch — e.g. one bounding
// box covering every imported BusStop) rather than one HTTP call per stop, since
// Overpass's public instance rate-limits per-client request volume.
public interface IStopLandmarkFetcher
{
    Task<string> FetchLandmarksAsync(CancellationToken cancellationToken = default);
}
