using BusNavigate.Domain.Interfaces.TripPlanning;

namespace BusNavigate.Domain.ViewModels.TripPlanning;

public record SearchTravelOptionsRequest(
    decimal CurrentLatitude, decimal CurrentLongitude, int DestinationPlaceId, PlaceKind DestinationType);
