import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Tabs, Tab, Typography, Pagination, Stack } from "@mui/material";
import "./Orders.scss";
import SearchIcon from "@mui/icons-material/Search";
import OrderItem from "../../../components/OrderItem/index.jsx";
import { orderTabs} from "../../../constraints/OrderItem";
import { useEffect } from "react";
import apiCart from "../../../apis/apiCart";
import { useSelector } from "react-redux";

function Orders() {
  const [orders, setOrders] = useState([]);
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const user = useSelector(state => state.auth.user)
  
  const size = 10;

  useEffect(() => {
    const getData = async () => {
      let params = {
        page: page,
        size: size,
        sort:'order_id',
      };
      apiCart.getOrdersByUser(params)
        .then(response=>{
          setOrders(response.data.listOrder);
          setTotalPage(Math.ceil(response.pagination._totalRows / size));
        })
        .catch(setOrders([]))
    };
    getData();
  }, [page,user]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleChangePage = (event, newValue) => {
    setPage(newValue);
  };
  console.log(orders)
  return (
    <>
      <Typography variant="h6">Đơn hàng của tôi</Typography>
      <Box className="myorder" sx={{ width: "100%" }}>
        <Box className="myorder__tabs">
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
            aria-label="full width tabs example"
          >
            {orderTabs.map((item) => (
              <Tab
                key={item.id}
                label={item.type}
                sx={{
                  fontSize: "12px",
                  textTransform: "none",
                  fontWeight: "400",
                }}
                {...a11yProps(item.id)}
              />
            ))}
          </Tabs>
        </Box>

        <Box className="myorder__search">
          <div className="myorder__search__logo">
            <SearchIcon />
          </div>
          <input
            type="text"
            className="myorder__search__input"
            placeholder="Tìm đơn hàng theo Mã đơn hàng, Đơn hàng, nhà bán"
          />
          <div className="myorder__search__btn">Tìm đơn hàng</div>
        </Box>

        <Box>
          {/* <TabPanel value={value} index={0} dir={theme.direction}> */}
            {orders.length!==0 ? (
              orders.map((item) => <OrderItem key={item.orderId} order={item} />)
            ) : (
              <Box  className="myorder__none">
                <img
                 height="200px"
                 width="200px"
                  src="https://res.cloudinary.com/duk2lo18t/image/upload/v1665719834/frontend/S-Phone_cpfelx.png"
                  alt=""
                />
                <Typography>Chưa có đơn hàng</Typography>
              </Box>
            )}
          {/* </TabPanel>
          {orderTabs.slice(1, orderTabs.length).map((item) => {
            const tmp = getOrderByType(orders, item.id);
            if (tmp.length === 0)
              return (
                <TabPanel key={item.id} value={value} index={item.id} dir={theme.direction}>
                  <Box className="myorder__none">
                    <img
                      height="200px"
                      width="200px"
                      src="https://res.cloudinary.com/duk2lo18t/image/upload/v1665719834/frontend/S-Phone_cpfelx.png"
                      alt=""
                    />
                    <Typography>Chưa có đơn hàng</Typography>
                  </Box>
                </TabPanel>
              );
            else
              return (
                <TabPanel key={item.id} value={value} index={item.id} dir={theme.direction}>
                  {tmp.map((item) => (
                    <OrderItem key={item.id} order={item} />
                  ))}
                </TabPanel>
              );
          })} */}

          {totalPage > 1 ? <Stack spacing={2}>
            <Typography>Page: {page}</Typography>
            <Pagination count={totalPage} page={page} onChange={handleChangePage} />
          </Stack> : <></>}
        </Box>
      </Box>
    </>
  );
}

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// const getOrderByType = (orders, id) =>
//   orders.filter((item) => item.orderId === id);

export default Orders;
