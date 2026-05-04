import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("cart_items").then((val) => {
      if (val) {
        try {
          setItems(JSON.parse(val) as CartItem[]);
        } catch {}
      }
    });
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    AsyncStorage.setItem("cart_items", JSON.stringify(next));
  };

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      const next = existing
        ? prev.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...prev, { ...item, quantity: 1 }];
      AsyncStorage.setItem("cart_items", JSON.stringify(next));
      return next;
    });
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      save(items.filter((i) => i.productId !== productId));
    } else {
      save(items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
    }
  };

  const removeItem = (productId: number) =>
    save(items.filter((i) => i.productId !== productId));

  const clearCart = () => save([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
