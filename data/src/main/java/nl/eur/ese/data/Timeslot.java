package nl.eur.ese.data;

import dz.jtsgen.annotations.TypeScript;
import java.time.LocalDateTime;

@TypeScript
public interface Timeslot
{	
	public LocalDateTime getStart();
	public LocalDateTime getEnd();
	public WeeklySlot asWeeklySlot();
}
