// Notification Utilities for Nooruna App
import { showInAppNotification } from '../components/NotificationBanner';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  type?: 'default' | 'success' | 'info' | 'warning' | 'gift' | 'prayer' | 'athkar' | 'quran';
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private audioContext: AudioContext | null = null;

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request permission to show notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a notification
   */
  async show(options: NotificationOptions & { soundType?: 'default' | 'rose' | 'heart' | 'message' }): Promise<void> {
    const finalType = options.type || (options.soundType === 'rose' || options.soundType === 'heart' ? 'gift' : 'default');

    try {
      // Show beautiful in-app notification first
      showInAppNotification({
        title: options.title,
        body: options.body,
        type: finalType,
        duration: options.requireInteraction ? 10000 : 7000
      });

      if (this.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          console.warn('Notification permission not granted for system notification');
          return;
        }
      }

      // Try to use Service Worker registration for better PWA support
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await registration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
            tag: options.tag || 'nooruna-default',
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false,
            badge: 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
            dir: 'rtl',
            lang: 'ar',
            data: { url: '/' },
            vibrate: options.silent ? [] : [200, 100, 200],
          } as any);

          // Play sound if not silent
          if (!options.silent) {
            this.playNotificationSound(options.soundType || 'default');
          }
          return;
        }
      }

      // Fallback to standard Notification API
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        badge: 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
        dir: 'rtl',
        lang: 'ar',
      });

      // Play sound if not silent
      if (!options.silent) {
        this.playNotificationSound(options.soundType || 'default');
      }

      // Auto-close after 10 seconds if not requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
      // Last resort fallback (standard API might fail in some contexts)
      try {
        new Notification(options.title, { body: options.body });
      } catch (e) { }
    }
  }

  /**
   * Play notification sound using Web Audio API
   */
  private playNotificationSound(type: 'default' | 'rose' | 'heart' | 'message' = 'default'): void {
    try {
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = this.audioContext;

      if (type === 'rose') {
        this.playRoseSound(context);
      } else if (type === 'heart') {
        this.playHeartSound(context);
      } else if (type === 'message') {
        this.playMessageSound(context);
      } else {
        this.playDefaultSound(context);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Resume AudioContext on user interaction (Required for iOS)
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted')) {
      try {
        await this.audioContext.resume();
        console.log('🔊 AudioContext resumed successfully');
      } catch (err) {
        console.error('❌ Failed to resume AudioContext:', err);
      }
    }
  }

  private playDefaultSound(context: AudioContext): void {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Bell-like sound with multiple frequencies
    oscillator.frequency.setValueAtTime(800, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);

    // Second chime for harmony
    const oscillator2 = context.createOscillator();
    const gainNode2 = context.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(context.destination);

    oscillator2.frequency.setValueAtTime(1000, context.currentTime + 0.15);
    oscillator2.frequency.exponentialRampToValueAtTime(500, context.currentTime + 0.25);

    gainNode2.gain.setValueAtTime(0.2, context.currentTime + 0.15);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);

    oscillator2.start(context.currentTime + 0.15);
    oscillator2.stop(context.currentTime + 0.6);
  }

  private playRoseSound(context: AudioContext): void {
    // Soft, romantic ascending chime
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.connect(gain);
      gain.connect(context.destination);

      osc.frequency.setValueAtTime(freq, context.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.2, context.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + i * 0.15 + 0.5);

      osc.start(context.currentTime + i * 0.15);
      osc.stop(context.currentTime + i * 0.15 + 0.5);
    });
  }

  private playHeartSound(context: AudioContext): void {
    // Warm, double-beat like heartbeat
    const notes = [392, 523.25]; // G4, C5
    [0, 0.2].forEach((delay, i) => {
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.connect(gain);
      gain.connect(context.destination);

      osc.frequency.setValueAtTime(notes[i % 2], context.currentTime + delay);
      gain.gain.setValueAtTime(0.25, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + delay + 0.3);

      osc.start(context.currentTime + delay);
      osc.stop(context.currentTime + delay + 0.3);
    });
  }

  private playMessageSound(context: AudioContext): void {
    // Quick, cheerful two-tone notification
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.setValueAtTime(600, context.currentTime);
    osc.frequency.setValueAtTime(800, context.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.3);
  }

  /**
   * Show prayer time notification
   */
  async notifyPrayerTime(prayerName: string, arabicName: string): Promise<void> {
    const title = `حان الآن وقت ${arabicName}`;
    const body = `تذكير بصلاة ${arabicName}. حافظ على صلاتك 🕌`;

    await this.show({
      title,
      body,
      tag: `prayer-${prayerName}`,
      requireInteraction: true,
      silent: false,
      type: 'prayer'
    });
  }

  /**
   * Show gift received notification
   */
  async notifyGiftReceived(senderName: string, giftType: 'rose' | 'heart' | 'message'): Promise<void> {
    const giftConfig = {
      rose: { emoji: '🌹', text: 'وردة', type: 'rose' },
      heart: { emoji: '❤️', text: 'قلب', type: 'heart' },
      message: { emoji: '💌', text: 'رسالة', type: 'message' }
    };

    const config = giftConfig[giftType];
    const title = `${config.emoji} ${senderName}`;
    const body = `أرسل لك ${config.text}`;

    await this.show({
      title,
      body,
      tag: giftType,
      requireInteraction: true,
      silent: false,
      soundType: giftType,
      type: 'gift'
    });
  }

  /**
   * Show athkar reminder notification
   */
  async notifyAthkar(type: 'morning' | 'evening'): Promise<void> {
    const arabicType = type === 'morning' ? 'الصباح' : 'المساء';
    const timeEmoji = type === 'morning' ? '🌅' : '🌙';
    const title = `${timeEmoji} تذكير بأذكار ${arabicType}`;
    const body = `حان وقت قراءة أذكار ${arabicType}. لا تنسَ أذكارك اليومية!`;

    await this.show({
      title,
      body,
      tag: `athkar-${type}`,
      requireInteraction: false,
      silent: false,
      type: 'athkar'
    });
  }

  /**
   * Show Quran reading reminder
   */
  async notifyQuranReading(surahName: string): Promise<void> {
    const title = `📖 تذكير بقراءة القرآن`;
    const body = `حان وقت قراءة ${surahName}. اغتنم الأجر!`;

    await this.show({
      title,
      body,
      tag: 'quran-reading',
      requireInteraction: false,
      silent: false,
      type: 'quran'
    });
  }

  /**
   * Check if permission is granted
   */
  isGranted(): boolean {
    return this.permission === 'granted';
  }
}

// Export singleton instance
export const notificationService = new NotificationService();