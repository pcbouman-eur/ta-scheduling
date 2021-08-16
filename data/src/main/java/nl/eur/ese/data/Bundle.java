package nl.eur.ese.data;

import dz.jtsgen.annotations.TypeScript;
import java.util.Set;

@TypeScript
public interface Bundle
{	
	public Set<Session> getSessions();
	public String getName();
	public Group getGroup();
	public WeeklySlot getWeeklySlot();
}
