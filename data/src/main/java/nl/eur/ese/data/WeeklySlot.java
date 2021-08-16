package nl.eur.ese.data;

import dz.jtsgen.annotations.TypeScript;
import java.time.Duration;
import java.time.LocalTime;
import java.time.DayOfWeek;

@TypeScript
public interface WeeklySlot
{	
	public DayOfWeek getDayOfWeek();
	public LocalTime getStart();
	public Duration getDuration();
}
