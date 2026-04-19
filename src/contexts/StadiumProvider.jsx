import React, { useState } from 'react';
import { StadiumContext } from './StadiumContext';

export function StadiumProvider({ children }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [matchData, setMatchData] = useState({ time: 0, status: 'Pre-match' });
  const [crowdLevels, setCrowdLevels] = useState({});

  return (
    <StadiumContext.Provider value={{
      selectedZone, setSelectedZone,
      matchData, setMatchData,
      crowdLevels, setCrowdLevels
    }}>
      {children}
    </StadiumContext.Provider>
  );
}

