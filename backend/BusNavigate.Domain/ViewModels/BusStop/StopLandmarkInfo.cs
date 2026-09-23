using BusNavigate.Domain.Entities;

namespace BusNavigate.Domain.ViewModels.BusStop;

public record StopLandmarkInfo(
    LandmarkType LandmarkType, string NameTh, string NameEn, string? Description, int DistanceMeters);
