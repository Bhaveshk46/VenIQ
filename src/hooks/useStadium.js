import { useContext } from 'react';
import { StadiumContext } from '../contexts/StadiumContext';

export function useStadium() {
  return useContext(StadiumContext);
}
