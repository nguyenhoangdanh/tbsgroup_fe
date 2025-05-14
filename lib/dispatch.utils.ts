import {useDispatch} from 'react-redux';

export const useDispatchType = () => {
  const dispatch = useDispatch();

  const callDispatchWithType = (type: string) => {
    dispatch({type});
  };

  return callDispatchWithType;
};
