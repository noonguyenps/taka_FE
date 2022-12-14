import { useCallback, useEffect, useState } from 'react'
import './Payment.scss'
import { Grid, Typography, Box, Button, Stack, Radio, RadioGroup } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoIcon from '@mui/icons-material/Info';
import DiscountIcon from '@mui/icons-material/Discount';
import { numWithCommas } from "../../constraints/Util"
import { useDispatch, useSelector } from 'react-redux'
import ChooseCoupon from '../../components/ChooseCoupon';
import ChooseAddress from '../../components/ChooseAddress';
import { clearCoupon } from '../../slices/paymentSlice';
import { Link, useNavigate } from 'react-router-dom'
import apiCart from '../../apis/apiCart';
import { toast } from 'react-toastify';
import { deleteItemsPayment } from '../../slices/cartSlice';
import { orderTabs } from '../../constraints/OrderItem';
import apiAddress from '../../apis/apiAddress'
import apiNotify from '../../apis/apiNotify'
import Loading from '../../components/Loading';
import AddressVN from '../../components/AddressVN';


function Payment() {
  const [open, setOpen] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), [])
  const [openAddress, setOpenAddress] = useState(false);
  const [ship, setShip] = useState('shipping1');
  const [payment, setPayment] = useState('1');
  const [expandDetail, setExpandDetail] = useState(false)
  const [couponValue, setCouponValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [listCart, setListCart] = useState([])
  const CartItems = useSelector(state => state.cart.items)
  const coupon = useSelector(state => state.payment.coupon)
  const addressShip = useSelector(state => state.payment.address)
  const user = useSelector(state => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const feeShip = ship === 'shipping1' ? 40000 : 23000
  const discountFeeShip = 10000

  useEffect(() => {
    if(user!=null){
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
  },[])

  useEffect(() => {
    const getAddresses = () => {
      apiAddress.getUserAddress()
        .catch(() => {
          navigate('/customer/address/create')
          toast.warning("Vui l??ng th??m ?????a ch??? m???i")
        })
    }
    getAddresses();// eslint-disable-next-line react-hooks/exhaustive-deps

    // const calcPrice = () => {
    //   if (CartItems.filter(item => item.choose).length === 0) {
    //     toast.warning("Vui l??ng ch???n ??t nh???t m???t m??n h??ng")
    //     navigate('/cart')
    //     return
    //   }
    // }
    // calcPrice();
    // // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // useEffect(() => {
  //   const handle = () => {
  //     if (coupon) {
  //       let value = 0
  //       if (coupon.unit === '??') {
  //         value = coupon.value
  //       }
  //       else {
  //         if (totalPrice > 0)
  //           value = (coupon.value * totalPrice / 100)
  //       }
  //       setCouponValue(value)
  //     }
  //   }
  //   handle()
  // }, [coupon, totalPrice])

  useEffect(() => {
    const loadTitle = () => {
      document.title = "????n h??ng c???a t??i"
    }
    loadTitle()
  }, [])




  const handleChangeTypeShip = (event) => {
    setShip(event.target.value);
  };

  const handleChangeTypePayment = (event) => {
    setPayment(event.target.value);
  };

  const handleExpand = () => {
    setExpandDetail(pre => !pre)
  }

  const handleOpenAddress = useCallback(() => setOpenAddress(true), []);
  const handleCloseAddress = useCallback(() => setOpenAddress(false), []);

  const unchooseCoupon = () => {
    dispatch(clearCoupon())
  }

  const finalPrice = () => {
    return totalPrice + feeShip - (couponValue || 0) - discountFeeShip > 0 ?
      Math.round(totalPrice + feeShip - (couponValue || 0) - discountFeeShip) : 0
  }


  const handleSubmitOrderFake = () => {
    if (loading) {
      toast.info("Thanh to??n ??ang ???????c th???c hi???n. Vui l??ng kh??ng thao t??c qu?? nhanh")
      return
    }
    if (!addressShip) {
      toast.warning("Vui l??ng ch???n ?????a ch??? giao h??ng")
      return;
    }
    //const state = orderTabs[Math.floor(Math.random() * (orderTabs.length - 1)) + 1]
    let state = orderTabs[2]
    if (payment === '3')//thanh to??n momo
      state = orderTabs[1]
    const payload = {
      "idUser": user?.id,
      "type": {
        "id": state.id,
        "name": state.type
      },
      address: addressShip,
      shipping: shippingMethods.find(item => item.id === ship),
      payment: paymentMethods.find(item => item.id === payment),
      feeShip,
      totalPrice,
      discount: discountFeeShip + couponValue || 0,
      products: CartItems.filter(item => item.choose).map(item => {
        return { ...item, discount: 0 }
      })
    }
    setLoading(true)
    apiCart.saveOrder(payload)
      .then(res => {

        if (payment === '3') {
          let amount = Math.round(res.totalPrice + res.feeShip - res.discount);
          amount = amount >= 0 ? amount : 0
          let orderId = res.id
          apiCart.makePaymentMomo(
            {
              orderId,
              amount,
            }
          ).then(res => {
            setLoading(false)
            if (res.payUrl) {
              dispatch(deleteItemsPayment())
              window.location.replace(res.payUrl)
            }
            else {
              handleCancel(orderId)
              toast.warning("C?? l???i trong qu?? tr??nh giao d???ch. Vui l??ng th???c hi???n l???i")
            }
          })
            .catch(err => {
              toast.error(err.response.data.error)
            })

        }
        else {
          toast.success("?????t h??ng th??nh c??ng!")
          let notify = {
            userId: user?.id,
            orderId: res?.id,
            type: "order",
            text: "B???n ???? ?????t h??ng th??nh c??ng, ????n h??ng c???a b???n ??ang ???????c x??? l??",
            date: Date.now(),
            seen: false,
            link: "",
          };
          apiNotify.postNotify(notify);
          dispatch(deleteItemsPayment())
          navigate('/customer/order/history')
          return
        }
      })
      .catch(error => {
        toast.error("?????t h??ng kh??ng th??nh c??ng. Vui l??ng th??? l???i")
      })
      .finally(() => {
        setLoading(false)

      })

  }

  const handleCancel = (id) => {
    let params = {
      //...order,
      type: {
        id: orderTabs[5].id,
        name: orderTabs[5].type,
      },
    };
    apiCart
      .changeTypeOrder(params, id)

  }


  return (<>
    <Box className="container" >
      <Grid container spacing={2} mt="24px">
        <Grid item lg={12} md={12} sm={12} xs={12}>
          <Box bgcolor="#fff" p={2}>
            <Box mb={2}>
              <Typography className="payment__title" gutterBottom variant="h5" component="div" >
                Danh s??ch s???n ph???m
              </Typography>
              <Stack className='payment__listItem' >
                {
                  listCart.filter(item => item.choose).map(item =>
                    <Stack key={1} direction="row" className="orderDetail__item" p={1}>
                      <Box mr={1.875}>
                        <img height="60px" width="60px" src={item.image} alt="" />
                      </Box>
                      <Stack spacing={1.5} width='100%'>
                        <Link to={`/product/${item.productId}`}><Typography sx={{ fontSize: "14px" }}>{item.name}</Typography></Link>
                        <Stack direction={'row'} justifyContent={'space-between'} >
                          <Typography fontSize='14px' color='#888'>{item.option}</Typography>
                          <Typography fontSize='14px' color='#888'>S??? L?????ng: {item.quantity}</Typography>
                          <Typography fontSize='14px' color='#888'>{numWithCommas(item.quantity * item.price || 0)} ???</Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  )
                }
              </Stack>
            </Box>
            <Box mb={2}>
              <Typography className="payment__title" gutterBottom variant="h5" component="div" >
                Ch???n h??nh th???c giao h??ng
              </Typography>
              <RadioGroup
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={ship}
                onChange={handleChangeTypeShip}
              >
                {
                  shippingMethods.map(item =>
                    <Stack key={item.id} direction="row" height="48px" >
                      <Radio name='shipping' value={item.id} id={item.id} sx={{ padding: 0, marginRight: "8px" }} />
                      <Typography sx={{ margin: "auto 0" }} component='label' htmlFor={item.id}>{item.display}</Typography>
                    </Stack>)
                }
              </RadioGroup>
            </Box>
            <Box>
              <Typography className="payment__title" gutterBottom variant="h5" component="div" >
                Ch???n h??nh th???c thanh to??n
              </Typography>
              <RadioGroup
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={payment}
                onChange={handleChangeTypePayment}
              >
                {
                  paymentMethods.map(item =>
                    <Stack key={item.id} direction="row" alignItems="center" sx={{ height: "64px" }} >
                      <Radio name='payment' id={String(item.id)} value={item.value} sx={{ padding: 0, marginRight: "8px" }} />
                      <img alt="" width="32px" height="32px" style={{ marginRight: "12px" }} src={item.image}></img>
                      <label htmlFor={item.id}><Typography sx={{ margin: "auto 0" }}>{item.display}</Typography></label>
                    </Stack>
                  )
                }
              </RadioGroup>
            </Box>
          </Box>
          <Box className='payment__address'>
            <Stack direction="row" mb={1.5} justifyContent="space-between">
              <Typography style={{ fontSize: "16px", fontWeight: 500, color: "#888" }}>Giao t???i</Typography>
              <Typography onClick={handleOpenAddress} color="#1890ff" sx={{ cursor: "pointer" }}>Thay ?????i</Typography>
            </Stack>
            {user?
              addressShip && <>
                <Typography mb={0.25} fontWeight={500}>{addressShip.name}&nbsp;&nbsp;&nbsp;{addressShip.phone}</Typography>
                <Typography color="#888">{addressShip.addressDetail}<AddressVN province={addressShip.province} district={addressShip.district} commune={addressShip.commune}></AddressVN></Typography></>
            :<Typography mb={0.25} fontWeight={500}>Vui l??ng ????ng nh???p ????? ch???n ?????a ch???</Typography>
            }
          </Box>
          <Box className='payment-coupon'>
            <Box className="payment-coupon__title">
              Phone-S Khuy???n m??i
            </Box>
            { 
              coupon &&
              <Box className="payment-coupon__item">
                <svg className="payment-coupon__bg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 286 60"><g fill="none" fillRule="evenodd"><g stroke="#017FFF"><g><g><g><g><g><path fill="#E5F2FF" d="M 278 0.5 c 2.071 0 3.946 0.84 5.303 2.197 c 1.358 1.357 2.197 3.232 2.197 5.303 h 0 v 44 c 0 2.071 -0.84 3.946 -2.197 5.303 c -1.357 1.358 -3.232 2.197 -5.303 2.197 h 0 H 64.973 c -0.116 -1.043 -0.587 -1.978 -1.291 -2.682 c -0.814 -0.814 -1.94 -1.318 -3.182 -1.318 c -1.243 0 -2.368 0.504 -3.182 1.318 c -0.704 0.704 -1.175 1.64 -1.29 2.682 h 0 h -48.028 c -2.071 0 -3.946 -0.84 -5.303 -2.197 c -1.358 -1.357 -2.197 -3.232 -2.197 -5.303 h 0 V 8 c 0 -2.071 0.84 -3.946 2.197 -5.303 c 1.357 -1.358 3.232 -2.197 5.303 -2.197 h 48.027 c 0.116 1.043 0.587 1.978 1.291 2.682 c 0.814 0.814 1.94 1.318 3.182 1.318 c 1.243 0 2.368 -0.504 3.182 -1.318 c 0.704 -0.704 1.175 -1.64 1.29 -2.682 H 64.972 z" transform="translate(-1024 -2912) translate(80 2252) translate(0 460) translate(464) translate(480) translate(0 200)"></path><g strokeDasharray="2 4" strokeLinecap="square"><path d="M0.5 0L0.5 48" transform="translate(-1024 -2912) translate(80 2252) translate(0 460) translate(464) translate(480) translate(0 200) translate(60 8)"></path></g></g></g></g></g></g></g></g></svg>
                <Box className="payment-coupon__content">
                  <Box p={1}>
                    <img src={coupon.img} alt="" />
                  </Box>
                  <Box className="payment-coupon__right">
                    <Typography fontSize="13px" fontWeight= "500">
                      {`Gi???m ${couponValue}K`}</Typography>
                    <Box>
                      <InfoIcon sx={{ color: "#1890ff" }} />
                      <Button onClick={unchooseCoupon} className="payment-coupon__unchoose" variant="contained">B??? ch???n</Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            }
            {user?(
              <Box onClick={handleOpen} className="payment-coupon__showmore">
              <DiscountIcon sx={{ height: "18px", color: "#0b74e5" }} /> Ch???n ho???c nh???p M?? Khuy???n M??i kh??c
              </Box>
            ):(
              <Typography fontSize="15px" fontWeight= "500">????ng nh???p ????? nh???n nhi???u ??u ????i b???n nh??</Typography>
            )}
          </Box>
        </Grid>
        <Grid item lg={12} md={12} sm={12} xs={12}>
          <Box>
            <Box className="cart-summary">
              <Box mb={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography style={{ fontWeight: 600, color: "#333" }}>Th??ng tin ????n h??ng</Typography>
                </Stack>
                <br></br>
                <Box className="cart-summary__price">
                  <span>T???m t??nh</span>
                  <span>{numWithCommas(totalPrice)} ???</span>
                </Box>
                <Box className="cart-summary__price">
                  <span>Ph?? v???n chuy???n</span>
                  <span>{numWithCommas(feeShip)} ???</span>
                </Box>
                <Box className="cart-summary__price">
                  <span>Khuy???n m??i v???n chuy???n</span>
                  <span style={{ color: "#00AB56" }}>{numWithCommas(-discountFeeShip)} ???</span>
                </Box>
                <Box className="cart-summary__price">
                  <span> Gi???m gi??</span>
                  <span style={{ color: "#00AB56" }}>{numWithCommas(-(couponValue || 0))} ???</span>
                </Box>
                <Box className="cart-summary__divider"></Box>
                <Box className="cart-summary__price">
                  <span>T???ng ti???n</span>
                  <Box className="cart-summary__valueprice">
                    <span>{numWithCommas(finalPrice())} ???</span>
                    <span>(???? bao g???m VAT n???u c??)</span>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Button variant="contained" onClick={handleSubmitOrderFake}
              sx={{ width: "100%", height: "42px", backgroundColor: "#ff424e", "&:hover": { opacity: 0.8, backgroundColor: "#ff424e" } }}>
              {loading && <Loading />} Mua h??ng</Button>

          </Box>
        </Grid>
      </Grid>
    </Box>
    <ChooseCoupon handleOpen={handleOpen} handleClose={handleClose} open={open} />
    <ChooseAddress handleOpen={handleOpenAddress} handleClose={handleCloseAddress} open={openAddress} />


  </>
  )
}

const shippingMethods = [
  {
    id: 'shipping1',
    display: 'Giao h??ng nhanh'
  },
  {
    id: 'shipping2',
    display: 'Giao h??ng ti??u chu???n'
  },
]

const paymentMethods = [
  {
    id: '1',
    display: "Thanh to??n ti???n m???t khi nh???n h??ng",
    value: '1',
    image: "https://frontend.tikicdn.com/_desktop-next/static/img/icons/checkout/icon-payment-method-cod.svg"
  },
  {
    id: '2',
    display: "Thanh to??n b???ng Viettel Money",
    value: '2',
    image: "https://frontend.tikicdn.com/_desktop-next/static/img/icons/checkout/icon-payment-method-viettelmoney.png"
  },
  {
    id: '3',
    display: "Thanh to??n b???ng Momo",
    value: '3',
    image: "https://frontend.tikicdn.com/_desktop-next/static/img/icons/checkout/icon-payment-method-momo.svg"
  },
  {
    id: '4',
    display: "Thanh to??n b???ng ZaloPay",
    value: '4',
    image: "https://frontend.tikicdn.com/_desktop-next/static/img/icons/checkout/icon-payment-method-zalo-pay.svg"
  },
  {
    id: '5',
    display: "Thanh to??n b???ng VNPay",
    value: '5',
    image: "https://frontend.tikicdn.com/_desktop-next/static/img/icons/checkout/icon-payment-method-vnpay.png"
  },
]

export default Payment