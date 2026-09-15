import {
    useDispatch,
    useSelector,
    type TypedUseSelectorHook,
} from "react-redux";
import type { AppDispatch, RootState } from "./store";

//  dispatch actions
export const useAppDispatch = () => useDispatch<AppDispatch>();

// read state from the store
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
