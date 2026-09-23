using BusNavigate.Domain.Interfaces.TripPlanning;

namespace BusNavigate.Domain.ViewModels.TripPlanning;

public record PlaceSearchResult(
    int Id, PlaceKind Type, string NameTh, string NameEn, decimal Latitude, decimal Longitude);
