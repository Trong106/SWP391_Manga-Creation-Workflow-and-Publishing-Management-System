namespace MangaStudio.Backend.Utilities;

public static class VietnamTime
{
    private static readonly TimeZoneInfo TimeZone = TimeZoneInfo.CreateCustomTimeZone(
        "Asia/Ho_Chi_Minh",
        TimeSpan.FromHours(7),
        "Vietnam Time",
        "Vietnam Time");

    public static DateTime FromUtc(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

        return TimeZoneInfo.ConvertTimeFromUtc(utc, TimeZone);
    }

    public static DateOnly Today => DateOnly.FromDateTime(FromUtc(DateTime.UtcNow));
}
