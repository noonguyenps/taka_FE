import React from "react";
import { useForm } from "react-hook-form";

import apiAuth from "../../apis/apiAuth";

import { ErrorInput, ErrorAfterSubmit } from "../ErrorHelper";

import {
  Stack,
  IconButton,
  Button,
  TextField,
  Input,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import {toast} from 'react-toastify'

function SignUp(props) {
  const [showPass, setShowPass] = React.useState(false);
  const [showPassConf, setShowPassConf] = React.useState(false);
  const [invalidPhone, setInvalidPhone] = React.useState(false);
  const [isDiffPass, setIsDiffPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const client_url = "https://tiki-web.vercel.app/"
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const handleCheckPass = () => {
    if (watch("pass") !== watch("passConf")) {
      setIsDiffPass(true);
    } else {
      setIsDiffPass(false);
      return true;
    }
  };

  const handleCheckPhone = async () => {
    let param = {
      phone: watch("phoneNumber"),
    };
    await apiAuth
      .postCheckPhone(param)
      .then((res) => {
        if(res.status===302){
          setInvalidPhone(true);
        }
        if(res.status===200){
          setInvalidPhone(false);
        }
      })
      .catch((error) => {
        setInvalidPhone(true);
      });
  };
  async function checkPhone() {
    let param = {
      phone: watch("phoneNumber"),
    };
    const request = await apiAuth.postCheckPhone(param)  
    return request
  }

  const onSubmit = async () => {
    if(loading){
      toast.warning("Thao t??c ??ang th???c hi???n. Vui l??ng kh??ng thao t??c qu?? nhanh")
      return
    }
    setLoading(true)
    checkPhone().then((res)=>{
      if(res.status===302){
        setInvalidPhone(true);
        setLoading(false);
      }
      if(res.status===200){
        setInvalidPhone(false);
        let param = {
          password: watch("pass"),
         phone: watch("phoneNumber"),
        };
        apiAuth.postRegister(param).then(setIsSuccess(true)).finally(()=>setLoading(false));
      }
    })
  };

  return (
    <Stack direction="row">
      <Stack direction="column" sx={{ flex: 5 }} spacing={3}>
        <Typography variant="h5">M???i b???n ????ng k?? t??i kho???n</Typography>
        <form>
          <Stack spacing={1}>
            <Stack width="100%">
              <TextField
                {...register("phoneNumber", {
                  required: "H??y nh???p s??? ??i???n tho???i",
                  pattern: {
                    value: /\d+/,
                    message: "S??? ??i???n tho???i kh??ng h???p l???",
                  },
                  minLength: {
                    value: 10,
                    message: "S??? ??i???n tho???i ph???i c?? ??t nh???t 10 ch??? s???",
                  },
                })}
                label="S??? ??i???n tho???i"
                variant="standard"
                sx={{ flex: 1 }}
              />
              {errors.phoneNumber && (
                <ErrorInput message={errors.phoneNumber.message} />
              )}
            </Stack>

            <FormControl sx={{ width: "100%" }} variant="standard">
              <InputLabel htmlFor="outlined-adornment-password">
                Nh???p m???t kh???u
              </InputLabel>
              <Input
                {...register("pass", {
                  required: "H??y nh???p m???t kh???u",
                  minLength: {
                    value: 8,
                    message: "M???t kh???u ph???i c?? ??t nh???t 8 k?? t???",
                  },
                })}
                variant="standard"
                type={showPass ? "text" : "password"}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPass(!showPass)}
                      edge="end">
                      {showPass ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
              />

              {errors.pass && <ErrorInput message={errors.pass.message} />}
            </FormControl>

            <FormControl sx={{ width: "100%" }} variant="standard">
              <InputLabel htmlFor="outlined-adornment-password">
                Nh???p l???i m???t kh???u
              </InputLabel>
              <Input
                {...register("passConf", {
                  required: "H??y nh???p l???i m???t kh???u",
                  minLength: {
                    value: 8,
                    message: "M???t kh???u ph???i c?? ??t nh???t 8 k?? t???",
                  },
                })}
                id="password-config"
                type={showPassConf ? "text" : "password"}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassConf(!showPassConf)}
                      edge="end"
                    >
                      {showPassConf ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
              />

              {errors.passConf && (
                <ErrorInput message={errors.passConf.message} />
              )}
            </FormControl>

            <Stack sx={{ marginTop: "5rem" }}>
              {invalidPhone && (
                <ErrorAfterSubmit message="S??? ??i???n tho???i ???? ???????c ????ng k??" />
              )}
              {isDiffPass ? (
                <ErrorAfterSubmit message="Nh???p l???i m???t kh???u kh??ng tr??ng v???i m???t kh???u" />
              ) : null}
            </Stack>

            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              color="error"
            >
              Ho??n T???t
            </Button>

            {isSuccess && <SuccessRegister handleOpenLogin={props.handleOpenLogin} />}
          </Stack>
        </form>
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Ho???c ti???p t???c b???ng
        </Typography>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
          <a href={`https://nhom3-tiki.herokuapp.com/oauth2/authorization/facebook?redirect_uri=${client_url}oauth2/redirect`} className="hre">
            <FacebookRoundedIcon
              sx={{
                cursor: 'pointer',
                color: "#4267b2",
                fontSize: "3rem"
              }} />
          </a>

          <a href={`https://nhom3-tiki.herokuapp.com/oauth2/authorization/google?redirect_uri=${client_url}oauth2/redirect`} className="hre">
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
              width="48" height="48"
              viewBox="0 0 48 48"
              style={{fill:"#000000"}}><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
          </a>
        </Stack>

        <p style={{ textAlign: "center" }}>
          B???ng vi???c ti???p t???c, b???n ???? ch???p nh???n{" "}
          <a href="/">??i???u kho???n s??? d???ng</a>
        </p>
      </Stack>

      <Stack
        sx={{
          flex: 3,
        }}
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <img
          alt=""
          src="https://res.cloudinary.com/duk2lo18t/image/upload/v1665719834/frontend/S-Phone_cpfelx.png"
          width="203"
          height="250"
        />
        <h4>Mua s???m t???i S-Phone</h4>
        <span>Tin c???t v?? nhanh ch??ng</span>
      </Stack>

      <span style={{ position: "absolute", top: 0, right: 0 }}>
        <IconButton onClick={props.closeModalLogin}>
          <CloseIcon />
        </IconButton>
      </span>
    </Stack>
  );
}

export default SignUp;

function SuccessRegister(props) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="center"
    >
      <CheckCircleOutlineIcon color="success" />
      <Typography sx={{ textAlign: "center" }}>????ng k?? th??nh c??ng</Typography>
      <Button variant="text" onClick={props.handleOpenLogin}>
        ????ng nh???p
      </Button>
    </Stack>
  );
}
