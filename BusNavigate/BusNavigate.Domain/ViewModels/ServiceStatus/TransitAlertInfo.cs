using BusNavigate.Domain.Entities;

namespace BusNavigate.Domain.ViewModels.ServiceStatus;

public record TransitAlertInfo(TransitAlertStatus Status, string? Description, DateTime EffectiveFrom, DateTime? EffectiveTo);
