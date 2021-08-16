package nl.eur.ese.data;

import dz.jtsgen.annotations.TypeScript;

@TypeScript
public interface Group
{	
	public default String getName() {
		if (isPlenary()) {
			return getGroupType();
		}
		return getGroupType() + getGroupNumber();
	}
	public String getGroupType();
	public String getGroupNumber();
	public boolean isPlenary();
}
