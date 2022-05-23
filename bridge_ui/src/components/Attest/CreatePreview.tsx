import { makeStyles, Typography } from "@material-ui/core";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAttestCreateTx,
  selectAttestTargetChain,
} from "../../store/selectors";
import { reset } from "../../store/attestSlice";
import ButtonWithLoader from "../ButtonWithLoader";
import ShowTx from "../ShowTx";
import { useHistory } from "react-router";

const useStyles = makeStyles((theme) => ({
  description: {
    textAlign: "center",
  },
}));

export default function CreatePreview() {
  const { push } = useHistory();
  const classes = useStyles();
  const dispatch = useDispatch();
  const targetChain = useSelector(selectAttestTargetChain);
  const createTx = useSelector(selectAttestCreateTx);
  const handleResetClick = useCallback(() => {
    dispatch(reset());
  }, [dispatch]);
  const handleReturnClick = useCallback(() => {
    dispatch(reset());
    push("/transfer");
  }, [dispatch, push]);

  const explainerString =
    "Success! The redeem transaction was submitted. The tokens will become available once the transaction confirms.";

  return (
    <>
      <Typography
        component="div"
        variant="subtitle2"
        className={classes.description}
      >
        {explainerString}
      </Typography>
      {createTx ? <ShowTx chainId={targetChain} tx={createTx} /> : null}
      <ButtonWithLoader onClick={handleResetClick}>
        Attest Another Token!
      </ButtonWithLoader>
      <ButtonWithLoader onClick={handleReturnClick}>
        Return to Transfer
      </ButtonWithLoader>
    </>
  );
}
