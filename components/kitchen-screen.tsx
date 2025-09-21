"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import axios from "axios";

// Type definitions
interface Customer {
  _id: string;
  name: string;
  phone: string;
  checkInTime: number;
  order_details: string;
  completed?: boolean;
}

interface OrderItem {
  _id: string;
  orderId: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
  category: string;
  createdAt: string;
  __v: number;
}

interface Order {
  _id: string;
  userId: {
    _id: string;
    phone: string;
    name: string;
    rewardPoints: number;
  };
  phone: string;
  name: string;
  orderNumber: string;
  status: "pending" | "preparing" | "ready" | "delivered" | "completed";
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: string;
  notes: string;
  estimatedPickupTime: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  items?: OrderItem[]; // Optional for now since API doesn't include it yet
}

export default function KitchenScreen() {
  const [activeCheckin, setActiveCheckin] = useState<Customer[]>([]);
  const [completedCheckin, setCompletedCheckin] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<
    "customers" | "orders" | "history"
  >("orders");
  const [orderDetails, setOrderDetails] = useState<{
    [key: string]: OrderItem[];
  }>({});

  useEffect(() => {
    const checkinData = async () => {
      const res = await axios.get(process.env.BACKEND_URL + "api/checkin/", {});
      setActiveCheckin(res.data);
    };

    const ordersData = async () => {
      try {
        const res = await axios.get(
          process.env.BACKEND_URL + "api/orders/",
          {}
        );
        // Extract orders from the response structure
        const ordersArray =
          res.data && res.data.orders && Array.isArray(res.data.orders)
            ? res.data.orders
            : [];
        setOrders(ordersArray);

        // Auto-load order details for each order
        for (const order of ordersArray) {
          await fetchOrderDetails(order._id);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        // Mock data for demonstration
        const mockOrders: Order[] = [
          {
            _id: "1",
            userId: {
              _id: "user1",
              phone: "+1234567890",
              name: "John Doe",
              rewardPoints: 2,
            },
            phone: "+1234567890",
            name: "John Doe",
            orderNumber: "ORD1234567890",
            status: "pending" as const,
            totalAmount: 25.5,
            subtotal: 25.5,
            tax: 0,
            discount: 0,
            paymentMethod: "cash",
            paymentStatus: "pending",
            notes: "",
            estimatedPickupTime: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
          {
            _id: "2",
            userId: {
              _id: "user2",
              phone: "+1234567891",
              name: "Jane Smith",
              rewardPoints: 1,
            },
            phone: "+1234567891",
            name: "Jane Smith",
            orderNumber: "ORD1234567891",
            status: "preparing" as const,
            totalAmount: 18.75,
            subtotal: 18.75,
            tax: 0,
            discount: 0,
            paymentMethod: "cash",
            paymentStatus: "pending",
            notes: "",
            estimatedPickupTime: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          },
        ];
        setOrders(mockOrders);
      }
    };

    checkinData();
    ordersData();
    setCompletedCheckin([]);
    // Poll the server every 5 seconds
    const interval = setInterval(() => {
      checkinData();
      ordersData();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const [loading, setLoading] = useState<string | null>(null);

  const handleMarkCompleted = async (id: string) => {
    setLoading(id);
    try {
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/";
      const res = await axios.post(
        BACKEND_URL + "api/checkin/completeCheckin",
        {
          id: id,
        }
      );

      const resCheckin = await axios.get(BACKEND_URL + "api/checkin/", {});
      setActiveCheckin(resCheckin.data);
    } catch (error) {
      console.error("Error marking as completed:", error);
    } finally {
      setLoading(null); // Reset loading state
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/";
      const res = await axios.get(BACKEND_URL + `api/orders/${orderId}`);
      setOrderDetails((prev) => ({
        ...prev,
        [orderId]: res.data.orderDetails || [],
      }));
    } catch (error) {
      console.error("Error fetching order details:", error);
      // Set empty array if API doesn't exist yet
      setOrderDetails((prev) => ({
        ...prev,
        [orderId]: [],
      }));
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    setLoading(orderId);
    try {
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/";
      await axios.put(BACKEND_URL + `api/orders/${orderId}/status`, {
        status: newStatus,
      });

      // Refresh orders data
      const res = await axios.get(BACKEND_URL + "api/orders/", {});
      const ordersArray =
        res.data && res.data.orders && Array.isArray(res.data.orders)
          ? res.data.orders
          : [];
      setOrders(ordersArray);
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleMarkOrderCompleted = async (orderId: string) => {
    setLoading(orderId);
    try {
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000/";
      await axios.put(BACKEND_URL + `api/orders/${orderId}/status`, {
        status: "completed",
      });

      // Refresh orders data
      const res = await axios.get(BACKEND_URL + "api/orders/", {});
      const ordersArray =
        res.data && res.data.orders && Array.isArray(res.data.orders)
          ? res.data.orders
          : [];
      setOrders(ordersArray);
    } catch (error) {
      console.error("Error marking order as completed:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveCheckin = (id: string) => {
    //removeCustomer(id)
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    //return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#F05122] text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {/*<Link href="/" className="mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>*/}
            <div className="w-24 h-12 relative rounded-full">
              <Image
                src="/images/le-vietnam.jpg"
                alt="LE VIETNAM"
                fill
                className="object-contain rounded-full"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Le Vietnam - Kitchen</h1>
          <div className="w-24"></div> {/* Empty div for flex spacing */}
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {/*<button
              onClick={() => setActiveTab("customers")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === "customers"
                  ? "bg-[#FFB347] text-gray-900 border-b-2 border-[#FFB347]"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Arrived Customers
            </button>*/}
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === "orders"
                  ? "bg-[#FFB347] text-gray-900 border-b-2 border-[#FFB347]"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === "history"
                  ? "bg-[#FFB347] text-gray-900 border-b-2 border-[#FFB347]"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              History
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "customers" && (
            <>
              <div className="bg-[#FFB347] p-4">
                {/*<h2 className="text-2xl font-bold text-center">
                  Arrived Customers
                </h2>*/}
                <p className="text-center text-sm mt-1">
                  Staff must tick the box after delivering the food to the
                  customer
                </p>
              </div>

              <div className="p-4">
                {activeCheckin.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No customers waiting
                  </div>
                ) : (
                  <div className="h-[calc(100vh-250px)] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-4">Name</th>
                          <th className="text-left py-2 px-4">Phone</th>
                          <th className="text-left py-2 px-4">Time</th>
                          {/*<th className="text-left py-2 px-4">Order Details</th>*/}
                          <th className="text-center py-2 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCheckin.map((customer) => (
                          <tr
                            key={customer._id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-4 px-4 font-semibold">
                              {customer.name}
                            </td>
                            <td className="py-4 px-4">{customer.phone}</td>
                            <td className="py-4 px-4">
                              {formatTime(customer.checkInTime)}
                            </td>
                            {/*<td className="py-4 px-4">{customer.order_details}</td>*/}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() =>
                                  handleMarkCompleted(customer._id)
                                }
                                className={`w-8 h-8 border-2 rounded inline-flex items-center justify-center transition-colors ${
                                  loading === customer._id
                                    ? "border-gray-400 bg-gray-200 cursor-not-allowed"
                                    : "border-gray-400 hover:bg-green-50 hover:border-green-500"
                                }`}
                                aria-label="Mark as completed"
                                disabled={loading === customer._id} // Disable button while loading
                              >
                                {loading === customer._id ? (
                                  <div className="loader w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                                ) : (
                                  customer.completed && (
                                    <Check className="h-5 w-5 text-green-600" />
                                  )
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "orders" && (
            <>
              <div className="bg-[#FFB347] p-4">
                {/*<h2 className="text-2xl font-bold text-center">
                  Orders
                </h2>*/}
                <p className="text-center text-sm mt-1">
                  Manage order status and track preparation progress
                </p>
              </div>

              <div className="p-4">
                {!Array.isArray(orders) || orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders to display
                  </div>
                ) : (
                  <div className="h-[calc(100vh-250px)] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-4">Customer</th>
                          <th className="text-left py-2 px-4">Phone</th>
                          <th className="text-left py-2 px-4">Order Time</th>
                          <th className="text-left py-2 px-4">Order Details</th>
                          <th className="text-left py-2 px-4">Arriving</th>
                          <th className="text-left py-2 px-4">Total</th>
                          <th className="text-center py-2 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(orders) &&
                          orders.map((order) => (
                            <tr
                              key={order._id}
                              className="border-b border-gray-100"
                            >
                              <td className="py-4 px-4 font-semibold">
                                {order.name}
                              </td>
                              <td className="py-4 px-4">{order.phone}</td>
                              <td className="py-4 px-4">
                                {formatTime(
                                  new Date(order.createdAt).getTime()
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="max-w-xs">
                                  <div className="text-sm font-medium">
                                    Order #{order.orderNumber}
                                  </div>
                                  <div className="text-sm text-gray-700 mt-1">
                                    <div className="bg-gray-50 p-2 rounded border">
                                      <div className="font-semibold text-gray-800 mb-2">
                                        Products:
                                      </div>
                                      <div className="space-y-1">
                                        {orderDetails[order._id] &&
                                        orderDetails[order._id].length > 0 ? (
                                          <div className="space-y-1">
                                            {orderDetails[order._id].map(
                                              (item, index) => (
                                                <div
                                                  key={index}
                                                  className="flex justify-between text-xs"
                                                >
                                                  <span className="text-gray-700">
                                                    {item.productName}
                                                  </span>
                                                  <span className="text-gray-500">
                                                    x{item.quantity}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                            {/*<div className="text-xs text-gray-500 mt-1 pt-1 border-t">
                                            <div className="flex justify-between">
                                              <span>Subtotal:</span>
                                              <span>${orderDetails[order._id].reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                                            </div>
                                          </div>*/}
                                          </div>
                                        ) : (
                                          <div className="text-gray-500 italic text-xs">
                                            Loading products...
                                          </div>
                                        )}
                                        {/*<div className="text-xs text-gray-600 mt-2">
                                        <div className="flex justify-between">
                                          <span>Order Total:</span>
                                          <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                                        </div>
                                      </div>*/}
                                      </div>
                                    </div>
                                    {order.notes && (
                                      <div className="text-xs text-gray-500 mt-2">
                                        <span className="font-medium">
                                          Notes:
                                        </span>{" "}
                                        {order.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {/* Arriving column: show Yes if customer checked in, No otherwise */}
                                {activeCheckin.some(
                                  (c) => c.phone === order.phone
                                ) ? (
                                  <span className="text-green-600 font-semibold">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex justify-center">
                                  {order.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        handleMarkOrderCompleted(order._id)
                                      }
                                      disabled={loading === order._id}
                                      className={`w-8 h-8 border-2 rounded inline-flex items-center justify-center transition-colors ${
                                        loading === order._id
                                          ? "border-gray-400 bg-gray-200 cursor-not-allowed"
                                          : "border-gray-400 hover:bg-green-50 hover:border-green-500"
                                      }`}
                                      aria-label="Mark order as completed"
                                    >
                                      {loading === order._id ? (
                                        <div className="loader w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                                      ) : null}
                                    </button>
                                  )}
                                  {order.status === "preparing" && (
                                    <button
                                      onClick={() =>
                                        handleMarkOrderCompleted(order._id)
                                      }
                                      disabled={loading === order._id}
                                      className={`w-8 h-8 border-2 rounded inline-flex items-center justify-center transition-colors ${
                                        loading === order._id
                                          ? "border-gray-400 bg-gray-200 cursor-not-allowed"
                                          : "border-gray-400 hover:bg-green-50 hover:border-green-500"
                                      }`}
                                      aria-label="Mark order as completed"
                                    >
                                      {loading === order._id ? (
                                        <div className="loader w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                                      ) : null}
                                    </button>
                                  )}
                                  {order.status === "ready" && (
                                    <button
                                      onClick={() =>
                                        handleMarkOrderCompleted(order._id)
                                      }
                                      disabled={loading === order._id}
                                      className={`w-8 h-8 border-2 rounded inline-flex items-center justify-center transition-colors ${
                                        loading === order._id
                                          ? "border-gray-400 bg-gray-200 cursor-not-allowed"
                                          : "border-gray-400 hover:bg-green-50 hover:border-green-500"
                                      }`}
                                      aria-label="Mark order as completed"
                                    >
                                      {loading === order._id ? (
                                        <div className="loader w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                                      ) : null}
                                    </button>
                                  )}
                                  {order.status === "delivered" && (
                                    <button
                                      onClick={() =>
                                        handleMarkOrderCompleted(order._id)
                                      }
                                      disabled={loading === order._id}
                                      className={`w-8 h-8 border-2 rounded inline-flex items-center justify-center transition-colors ${
                                        loading === order._id
                                          ? "border-gray-400 bg-gray-200 cursor-not-allowed"
                                          : "border-gray-400 hover:bg-green-50 hover:border-green-500"
                                      }`}
                                      aria-label="Mark order as completed"
                                    >
                                      {loading === order._id ? (
                                        <div className="loader w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                                      ) : null}
                                    </button>
                                  )}
                                  {loading === order._id && (
                                    <div className="loader w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin mx-auto"></div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === "history" && (
            <>
              <div className="bg-[#FFB347] p-4">
                {/*<h2 className="text-2xl font-bold text-center">
                  Orders
                </h2>*/}
                <p className="text-center text-sm mt-1">
                  Manage order status and track preparation progress
                </p>
              </div>

              <div className="p-4">
                {!Array.isArray(orders) || orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders to display
                  </div>
                ) : (
                  <div className="h-[calc(100vh-250px)] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-4">Customer</th>
                          <th className="text-left py-2 px-4">Phone</th>
                          <th className="text-left py-2 px-4">Order Time</th>
                          <th className="text-left py-2 px-4">Order Details</th>
                          <th className="text-left py-2 px-4">Arriving</th>
                          <th className="text-left py-2 px-4">Total</th>
                          <th className="text-center py-2 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(orders) &&
                          orders.map((order) => (
                            <tr
                              key={order._id}
                              className="border-b border-gray-100"
                            >
                              <td className="py-4 px-4 font-semibold">
                                {order.name}
                              </td>
                              <td className="py-4 px-4">{order.phone}</td>
                              <td className="py-4 px-4">
                                {formatTime(
                                  new Date(order.createdAt).getTime()
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="max-w-xs">
                                  <div className="text-sm font-medium">
                                    Order #{order.orderNumber}
                                  </div>
                                  <div className="text-sm text-gray-700 mt-1">
                                    <div className="bg-gray-50 p-2 rounded border">
                                      <div className="font-semibold text-gray-800 mb-2">
                                        Products:
                                      </div>
                                      <div className="space-y-1">
                                        {orderDetails[order._id] &&
                                        orderDetails[order._id].length > 0 ? (
                                          <div className="space-y-1">
                                            {orderDetails[order._id].map(
                                              (item, index) => (
                                                <div
                                                  key={index}
                                                  className="flex justify-between text-xs"
                                                >
                                                  <span className="text-gray-700">
                                                    {item.productName}
                                                  </span>
                                                  <span className="text-gray-500">
                                                    x{item.quantity}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                            {/*<div className="text-xs text-gray-500 mt-1 pt-1 border-t">
                                            <div className="flex justify-between">
                                              <span>Subtotal:</span>
                                              <span>${orderDetails[order._id].reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                                            </div>
                                          </div>*/}
                                          </div>
                                        ) : (
                                          <div className="text-gray-500 italic text-xs">
                                            Loading products...
                                          </div>
                                        )}
                                        {/*<div className="text-xs text-gray-600 mt-2">
                                        <div className="flex justify-between">
                                          <span>Order Total:</span>
                                          <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                                        </div>
                                      </div>*/}
                                      </div>
                                    </div>
                                    {order.notes && (
                                      <div className="text-xs text-gray-500 mt-2">
                                        <span className="font-medium">
                                          Notes:
                                        </span>{" "}
                                        {order.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {/* Arriving column: show Yes if customer checked in, No otherwise */}
                                {activeCheckin.some(
                                  (c) => c.phone === order.phone
                                ) ? (
                                  <span className="text-green-600 font-semibold">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex justify-center">
                                  <Check className="h-5 w-5 text-green-600" />
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {completedCheckin.length > 0 && activeTab === "customers" && (
          <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-100 p-4">
              <h2 className="text-xl font-bold text-center text-green-800">
                Recently Completed
              </h2>
            </div>

            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Phone</th>
                    <th className="text-left py-2 px-4">Time</th>
                    <th className="text-center py-2 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {completedCheckin.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b border-gray-100 text-gray-500"
                    >
                      <td className="py-3 px-4 line-through">
                        {customer.name}
                      </td>
                      <td className="py-3 px-4 line-through">
                        {customer.phone}
                      </td>
                      <td className="py-3 px-4 line-through">
                        {formatTime(customer.checkInTime)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          // onClick={() => handleRemoveCustomer(customer._id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
