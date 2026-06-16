using System;
using System.Collections.Generic;

namespace MangaStudio.Backend.Models.DTOs;

public class SaveVotesDto
{
    public int WeekNumber { get; set; }
    public int YearNumber { get; set; }
    public List<SeriesVoteInputDto> Votes { get; set; } = new();
}

public class SeriesVoteInputDto
{
    public Guid SeriesId { get; set; }
    public int Votes { get; set; }
}
