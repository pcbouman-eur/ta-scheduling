package nl.eur.ese.data;

import dz.jtsgen.annotations.TypeScript;
import java.util.Set;

@TypeScript
public interface Session
{	
	public Long getId();
	public String getName();
	public String getLocation();
	public String getType();
	public Group getGroup();
	public Timeslot getTimeSlot();
	public Set<String> getRequiredCapabilities();
	public int getStaffNeeded();
	public boolean getCanBundle();
}
