import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (product: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const wishlistRef = doc(db, 'wishlists', user.uid);
        const unsubscribeWishlist = onSnapshot(wishlistRef, (doc) => {
          if (doc.exists()) {
            setWishlist(doc.data().items || []);
          } else {
            setWishlist([]);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `wishlists/${user.uid}`);
          setLoading(false);
        });

        return () => unsubscribeWishlist();
      } else {
        setWishlist([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const addToWishlist = async (product: WishlistItem) => {
    if (!auth.currentUser) {
      toast.error("Please sign in to save items to your wishlist.");
      return;
    }

    const wishlistRef = doc(db, 'wishlists', auth.currentUser.uid);
    try {
      const docSnap = await getDoc(wishlistRef);
      if (!docSnap.exists()) {
        await setDoc(wishlistRef, { items: [product] });
      } else {
        await updateDoc(wishlistRef, {
          items: arrayUnion(product)
        });
      }
      toast.success(`${product.name} added to wishlist!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `wishlists/${auth.currentUser.uid}`);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!auth.currentUser) return;

    const wishlistRef = doc(db, 'wishlists', auth.currentUser.uid);
    const itemToRemove = wishlist.find(item => item.id === productId);
    
    if (!itemToRemove) return;

    try {
      await updateDoc(wishlistRef, {
        items: arrayRemove(itemToRemove)
      });
      toast.success(`${itemToRemove.name} removed from wishlist.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `wishlists/${auth.currentUser.uid}`);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
