package nl.eur.ese.data;

import dz.jtsgen.annotations.TypeScript;
import java.util.Map;

@TypeScript
public interface UserPreference
{	
	public String getUserId();
	public Map<WeeklySlot,Preference> getSlotPreferences();
	public Map<Integer,Preference> getConsecutivePreferences();
	public Map<Integer,Preference> getDifferentDaysPreference();
	public Map<String,Preference> getGroupPreferences();
	public Map<String,Boolean> getCapabilities();
	public String getSchedulingComment();
}
