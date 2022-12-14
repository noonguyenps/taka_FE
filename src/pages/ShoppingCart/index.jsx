import { useCallback, useEffect, useState } from 'react'
import './ShoppingCart.scss'
import { Grid, Typography, Button, Stack, Box, Dialog } from '@mui/material'
import CartItem from '../../components/CartItem'
import CartItemUser from '../../components/CartItemUser'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { numWithCommas } from "../../constraints/Util"
import { useSelector, useDispatch } from 'react-redux'
import { unchooseAll, chooseAll, deleteAll } from '../../slices/cartSlice'
import { useNavigate } from "react-router-dom"
import ChooseAddress from '../../components/ChooseAddress';
import {toast} from 'react-toastify'
import { clearCoupon } from '../../slices/paymentSlice';
import apiCart from '../../apis/apiCart';
import el from 'date-fns/esm/locale/el/index.js'

function ShoppingCart() {
  const [open, setOpen] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [dialogDelete, setDialogDelete] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [couponValue, setCouponValue] = useState(0)
  const CartItems = useSelector(state => state.cart.items)
  const dispatch = useDispatch()
  const [listCart, setListCart] = useState([]);
  const user = useSelector(state => state.auth.user)
  const coupon = useSelector(state => state.payment.coupon)
  const addressShip = useSelector(state => state.payment.address)

  useEffect(() => {
    if(user==null){
      const calcPrice = () => {
        const total = CartItems.reduce((t, num) => num.choose ? t + num.price * num.quantity : t, 0)
        setTotalPrice(total)
      }
      calcPrice()
    }else{
      async function fetchData() {
          await apiCart.getUserCart()
          .then((res)=>{
            setListCart(res.data.listCart);
            let totalTemp = 0;
            for(let a in res.data.listCart){
              if(res.data.listCart[a].choose){
                totalTemp+=res.data.listCart[a].price*res.data.listCart[a].quantity;
              }
            }
            setTotalPrice(totalTemp)
          }).catch((err)=>{
            toast.warning("C?? l???i x???y ra" + err);
          })
      }
      fetchData();
    }
  }, [])

  useEffect(()=>{
    const loadTitle = ()=>{
      document.title =  "Gi??? h??ng"
    }
    loadTitle()
  },[])
  useEffect(()=>{
    const handle = ()=>{
      if(coupon){
        let value = 0
        if(coupon.unit === '??'){
          value = coupon.value / 1000
        }
        else {
          if(totalPrice>0)
            value = (coupon.value * totalPrice / 100)/1000
        }
        setCouponValue(value)
      }
    }
    handle()
  },[coupon,totalPrice])

  const handleDeleteAll = () => {
    if(user){
      apiCart.deleteAll()
      .then((res)=>{
        if(res.status === 200){
          setListCart([]);
        }
      });
    }
    else{
      dispatch(deleteAll())
    }
    closeDialogDeleteAll()
  }
  const handleChangeCartData = (id, quantity, choose) =>{
    const a = listCart.findIndex((item)=>(item.id === id))
    listCart[a].quantity = quantity;
    listCart[a].choose = choose
    setListCart((prev)=>[...prev]);
    for(let a in listCart){
      if(listCart[a].choose){
        setTotalPrice(totalPrice+listCart[a].price*listCart[a].quantity)
      }
    }
  }
  const handleDeleteCart = async (id)=>{
    const a = listCart.findIndex((item)=>(item.id === id))
    listCart.splice(a,1);
    setListCart((prev)=>[...prev]);
  }
  const openDialogDeleteAll = () => {
    setDialogDelete(true)
  }
  const closeDialogDeleteAll = () => {
    setDialogDelete(false)
  }
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleOpenAddress = useCallback(() => {
    if(user){
      setOpenAddress(true)
    }
    else{
      toast.warning("Vui l??ng ????ng nh???p ????? ch???n ?????a ch???")
    }
  }, [user]);
  const handleCloseAddress = useCallback(() => setOpenAddress(false), []);
  
  const unchooseCoupon = () => {
    dispatch(clearCoupon())
  }
  const navigate = useNavigate()
   const handleBuy = async ()=>{
    if(user){
      if(listCart.filter(item=>item.choose).length===0){
        toast.warning("Vui l??ng ch???n ??t nh???t m???t m??n h??ng")
      }
      else{
        for(let a in listCart){
          let params = {
            id: listCart[a].id,
            quantity: listCart[a].quantity,
            status: listCart[a].choose
          }
          await apiCart.updateCart(params)
        }
      }
      navigate('/payment')
    }
    else{
      toast.warning("B???n c???n ????ng nh???p ????? th???c hi???n ch???c n??ng n??y")
    }
  }
  const finalPrice = () => {
    return totalPrice - (coupon?.value || 0)  > 0 ?
    Math.round(totalPrice - (coupon?.value || 0)) : 0
  }
  return (<>
    <Box className="container" >
      <Grid container spacing={2} style={{ marginTop: "5px" }}>
        <Grid item lg={12} md={12} sm={12} xs={12}>
          <Box>
            <Typography className="cart__title" gutterBottom variant="h5" component="div" >
              GI??? H??NG
            </Typography>

            <Box className="cart__heading cart">
              <Stack direction="row">
                {user?`T???t c??? (${listCart.length} s???n ph???m)`:`T???t c??? (${CartItems.length} s???n ph???m)`}
              </Stack>
              <Stack>????n gi??</Stack>
              <Stack>S??? l?????ng</Stack>
              <Stack>Th??nh ti???n</Stack>
              <Stack>
                <span onClick={openDialogDeleteAll}><DeleteOutlinedIcon /></span>
              </Stack>
            </Box>
            <Stack className="cart__list">
              {
                user?(
                  listCart?.map(item => <CartItemUser key={item.id+' '+item.price} data={item} handleChangeCartData={(id,quantity,choose)=>{handleChangeCartData(id,quantity,choose)}} handleDeleteCart={(id)=>{handleDeleteCart(id)}}/>)
                ):(
                CartItems.map(item => <CartItem key={item.id+' '+item.price} data={item} />))
              }
            </Stack>
          </Box>
          <Box>
            <Box className="cart-summary">
              <Box className="cart-summary__price">
                <span>
                  T???m t??nh
                </span>
                <span>{numWithCommas(totalPrice)} ???</span>
              </Box>
              <Box className="cart-summary__price">
                <span>
                  T???ng ti???n
                </span>
                <Box className="cart-summary__valueprice">
                  <span>{numWithCommas(finalPrice())} ???</span>
                </Box>
              </Box>
            </Box>
              <Button variant="contained" onClick={handleBuy}
                sx={{ width: "100%", height: "42px", backgroundColor: "#ff424e", "&:hover": { opacity: 0.8, backgroundColor: "#ff424e" } }}>
                Mua h??ng
              </Button>
          </Box>
        </Grid>
        </Grid>
    </Box>
    {dialogDelete &&
      <Dialog onClose={closeDialogDeleteAll} open={dialogDelete}>
        <Box className="dialog-removecart">
          <Box className="dialog-removecart__title">
            <h4>Xo?? s???n ph???m</h4>
          </Box>
          <Box className="dialog-removecart__content">
            B???n c?? mu???n x??a t???t c??? s???n ph???m trong gi??? h??ng
          </Box>
          <Box className="dialog-removecart__choose">
            <Button
              variant="outlined"
              onClick={handleDeleteAll}
              sx={{ width: "94px", height: "36px" }}
            >
              X??c nh???n
            </Button>
            <Button
              variant="contained"
              onClick={closeDialogDeleteAll}
              sx={{ width: "57px", height: "36px" }}
            >
              Hu???
            </Button>
          </Box>
        </Box>
      </Dialog>}
  </>
  )
}


export default ShoppingCart