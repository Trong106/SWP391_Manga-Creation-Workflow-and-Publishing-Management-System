using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MangaStudio.Backend.Serialization;

/// <summary>
/// SQL Server datetime2 does not retain DateTime.Kind. All persisted timestamps in
/// this application are UTC, so restore that contract at the API boundary.
/// </summary>
public sealed class UtcDateTimeJsonConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetDateTime();
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
        writer.WriteStringValue(utc.ToString("O", CultureInfo.InvariantCulture));
    }
}

public sealed class NullableUtcDateTimeJsonConverter : JsonConverter<DateTime?>
{
    private readonly UtcDateTimeJsonConverter _inner = new();

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.Null ? null : _inner.Read(ref reader, typeof(DateTime), options);

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue) _inner.Write(writer, value.Value, options);
        else writer.WriteNullValue();
    }
}
