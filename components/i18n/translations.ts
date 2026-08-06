"use client";

export type Language = "en" | "th";

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "pawjai.language";

const THAI_TEXT: Record<string, string> = {
  Home: "หน้าแรก",
  Filter: "ค้นหา",
  Appointments: "นัดหมาย",
  Profile: "โปรไฟล์",
  More: "เพิ่มเติม",
  Settings: "ตั้งค่า",
  Account: "บัญชี",
  Support: "ช่วยเหลือ",
  Reset: "รีเซ็ต",
  Cancel: "ยกเลิก",
  Close: "ปิด",
  Continue: "ดำเนินการต่อ",
  Submit: "ส่งข้อมูล",
  "Save & Exit": "บันทึกและออก",
  Manage: "จัดการ",
  "Manage →": "จัดการ →",
  "Back to top": "กลับไปด้านบน",
  "Set preferences": "ตั้งค่าความชอบ",
  "Show Dogs": "แสดงสุนัข",
  "No dogs available yet": "ยังไม่มีสุนัขพร้อมรับเลี้ยง",
  "Shelters are getting ready — check back soon!": "ศูนย์พักพิงกำลังเตรียมข้อมูล กลับมาดูใหม่เร็วๆ นี้",
  "You've seen them all!": "คุณดูครบหมดแล้ว",
  "All available dogs are shown above.": "สุนัขที่พร้อมรับเลี้ยงทั้งหมดอยู่ด้านบน",
  Share: "แชร์",
  "Book appointment": "จองนัดหมาย",
  Save: "บันทึก",
  "Saving...": "กำลังบันทึก...",
  Saved: "บันทึกแล้ว",
  "Sign in": "เข้าสู่ระบบ",
  "Sign in / Create account": "เข้าสู่ระบบ / สร้างบัญชี",
  "Sign out": "ออกจากระบบ",
  "Create account": "สร้างบัญชี",
  "Log in": "เข้าสู่ระบบ",
  "Verify email": "ยืนยันอีเมล",
  "Verify account": "ยืนยันบัญชี",
  "Open sign in": "เปิดหน้าเข้าสู่ระบบ",
  Email: "อีเมล",
  Password: "รหัสผ่าน",
  "Create password": "สร้างรหัสผ่าน",
  "Confirm password": "ยืนยันรหัสผ่าน",
  "6-digit code": "รหัส 6 หลัก",
  "Signing in...": "กำลังเข้าสู่ระบบ...",
  "Signing in with Google...": "กำลังเข้าสู่ระบบด้วย Google...",
  "Creating...": "กำลังสร้างบัญชี...",
  "Verifying...": "กำลังยืนยัน...",
  "Continue with Google": "ดำเนินการต่อด้วย Google",
  "Resend verification email": "ส่งอีเมลยืนยันอีกครั้ง",
  or: "หรือ",
  "Already have an account? Log in": "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ",
  "New here? Create account": "มาใหม่ใช่ไหม? สร้างบัญชี",
  "Save your dogs, preferences, visits, and documents.": "บันทึกสุนัขที่ชอบ ความต้องการ นัดหมาย และเอกสารของคุณ",
  "Use your email now. Profile details can wait until documents.": "ใช้อีเมลก่อน รายละเอียดโปรไฟล์ค่อยกรอกในขั้นตอนเอกสาร",
  "Use the code from your PawJai email.": "ใช้รหัสจากอีเมล PawJai ของคุณ",
  "Check your email for the PawJai verification link or 6-digit code.": "ตรวจอีเมลเพื่อดูลิงก์ยืนยัน PawJai หรือรหัส 6 หลัก",
  "Check your email to verify your account, then come back to sign in.": "ตรวจอีเมลเพื่อยืนยันบัญชี แล้วกลับมาเข้าสู่ระบบ",
  "Enter the email you used to create your account.": "กรอกอีเมลที่ใช้สร้างบัญชี",
  "We sent a fresh verification email.": "เราส่งอีเมลยืนยันใหม่ให้แล้ว",
  "Please check your details.": "กรุณาตรวจสอบข้อมูลอีกครั้ง",
  "Please check the code.": "กรุณาตรวจสอบรหัสอีกครั้ง",
  "Google sign in could not finish. Please try again.": "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง",
  "Sign in to continue": "เข้าสู่ระบบเพื่อดำเนินการต่อ",
  "Sign in to save dogs to your wishlist.": "เข้าสู่ระบบเพื่อบันทึกสุนัขใน Wishlist",
  "Sign in to save your matching preferences.": "เข้าสู่ระบบเพื่อบันทึกความต้องการของคุณ",
  "Sign in to book a shelter visit.": "เข้าสู่ระบบเพื่อจองเวลาเยี่ยมศูนย์พักพิง",
  Wishlist: "Wishlist",
  "Ready for shelter visits": "พร้อมสำหรับการเยี่ยมศูนย์พักพิง",
  Verification: "การยืนยันตัวตน",
  "Verification status": "สถานะการยืนยัน",
  "Complete once to unlock booking": "ทำให้เสร็จครั้งเดียวเพื่อปลดล็อกการจอง",
  "Not started": "ยังไม่เริ่ม",
  Submitted: "ส่งแล้ว",
  Approved: "อนุมัติแล้ว",
  "Book a Visit": "จองเวลาเยี่ยม",
  Unavailable: "ไม่ว่าง",
  "Your Select": "วันที่เลือก",
  "Available times": "เวลาที่ว่าง",
  "Loading visit times for this date...": "กำลังโหลดเวลาสำหรับวันนี้...",
  "Loading visit times...": "กำลังโหลดเวลา...",
  "No visit times are available for this date.": "วันนี้ไม่มีเวลาว่าง",
  "No visit times are available on this date.": "วันนี้ไม่มีเวลาว่าง",
  "Note (optional)": "โน้ต (ไม่บังคับ)",
  "Confirm Visit": "ยืนยันการนัดหมาย",
  "e.g. I have a child aged 5. Does the dog get along with kids?": "เช่น ที่บ้านมีเด็กอายุ 5 ขวบ สุนัขเข้ากับเด็กได้ไหม?",
  January: "มกราคม",
  February: "กุมภาพันธ์",
  March: "มีนาคม",
  April: "เมษายน",
  May: "พฤษภาคม",
  June: "มิถุนายน",
  July: "กรกฎาคม",
  August: "สิงหาคม",
  September: "กันยายน",
  October: "ตุลาคม",
  November: "พฤศจิกายน",
  December: "ธันวาคม",
  Su: "อา",
  Mo: "จ",
  Tu: "อ",
  We: "พ",
  Th: "พฤ",
  Fr: "ศ",
  Sa: "ส",
  Age: "อายุ",
  Gender: "เพศ",
  Size: "ขนาด",
  Weight: "น้ำหนัก",
  Male: "เพศผู้",
  Female: "เพศเมีย",
  male: "เพศผู้",
  female: "เพศเมีย",
  unknown: "ไม่ทราบ",
  Unknown: "ไม่ทราบ",
  Mixed: "พันธุ์ผสม",
  "Mixed Breed": "พันธุ์ผสม",
  Small: "เล็ก",
  Medium: "กลาง",
  Large: "ใหญ่",
  small: "เล็ก",
  medium: "กลาง",
  large: "ใหญ่",
  "extra large": "ใหญ่มาก",
  Low: "น้อย",
  High: "สูง",
  Calm: "ใจเย็น",
  "Easy-going": "สบายๆ",
  Energetic: "พลังเยอะ",
  "Low energy": "พลังงานน้อย",
  "Medium energy": "พลังงานปานกลาง",
  "High energy": "พลังงานสูง",
  Sterilized: "ทำหมันแล้ว",
  "House trained": "ฝึกอยู่บ้านแล้ว",
  "House-trained": "ฝึกอยู่บ้านแล้ว",
  "Leash-trained": "ฝึกเดินสายจูงแล้ว",
  "Good w/ kids": "เข้ากับเด็กได้",
  "Good w/ dogs": "เข้ากับสุนัขได้",
  "Good w/ cats": "เข้ากับแมวได้",
  "Good with kids": "เข้ากับเด็กได้",
  "Dog-friendly": "เป็นมิตรกับสุนัข",
  "People-friendly": "เป็นมิตรกับคน",
  "Looking for a home": "กำลังมองหาบ้าน",
  "Special needs": "ความต้องการพิเศษ",
  None: "ไม่มี",
  "their shelter": "ศูนย์พักพิง",
  Sponsored: "สนับสนุน",
  "Maybe later": "ไว้ทีหลัง",
  "Give more →": "เพิ่มจำนวน →",
  "Custom amount (฿)": "จำนวนเงินเอง (฿)",
  "e.g. 100": "เช่น 100",
  "← Back to treats": "← กลับไปเลือกขนม",
  "1 treat": "ขนม 1 ชิ้น",
  "1 treats": "ขนม 1 ชิ้น",
  "What size of pet do you prefer?": "คุณอยากได้สุนัขขนาดไหน?",
  "You can choose more than one": "เลือกได้มากกว่าหนึ่งข้อ",
  "What about their age?": "อยากได้ช่วงอายุเท่าไร?",
  "Please state their range of age": "เลือกช่วงอายุที่ต้องการ",
  "What about their breed?": "อยากได้สายพันธุ์แบบไหน?",
  "How active do you want your dog to be?": "อยากได้สุนัขที่แอคทีฟแค่ไหน?",
  "You can choose multiple": "เลือกได้หลายข้อ",
  "What about their protectiveness?": "อยากได้ระดับการเฝ้าบ้านแบบไหน?",
  "How would you like the dog to show affection?": "อยากให้สุนัขแสดงความรักแบบไหน?",
  "Do you want trained dogs?": "ต้องการสุนัขที่ผ่านการฝึกไหม?",
  "Select one": "เลือกหนึ่งข้อ",
  "Friendliness to people?": "เข้ากับคนได้แค่ไหน?",
  "Choose one": "เลือกหนึ่งข้อ",
  "Friendliness to other dogs?": "เข้ากับสุนัขตัวอื่นได้แค่ไหน?",
  "Friendliness to cats?": "เข้ากับแมวได้ไหม?",
  "Friendliness to kids (under 4)?": "เข้ากับเด็กเล็กอายุต่ำกว่า 4 ขวบได้ไหม?",
  "Any special needs you're willing to accommodate?": "คุณดูแลความต้องการพิเศษแบบไหนได้บ้าง?",
  "eg. Chihuahua, Pug": "เช่น ชิวาวา, ปั๊ก",
  "eg. Beagle, Thai Bangkaew, Bull Terrier": "เช่น บีเกิล, ไทยบางแก้ว, บูลเทอร์เรีย",
  "eg. Labrador, Husky, Golden Retriever": "เช่น ลาบราดอร์, ฮัสกี้, โกลเด้น รีทรีฟเวอร์",
  "Relaxed, calm companion": "เพื่อนที่นิ่ง สบายๆ ใจเย็น",
  "Daily walks and light play": "เดินเล่นทุกวันและเล่นเบาๆ",
  "Need a lot of activities": "ต้องการกิจกรรมเยอะ",
  "Very chill - not reactive": "ชิลมาก ไม่ค่อยตอบสนองต่อสิ่งรบกวน",
  "Rarely barks or reacts to disturbance": "ไม่ค่อยเห่าหรือตอบสนองต่อสิ่งรบกวน",
  "Barks to alert, but not aggressive": "เห่าเตือน แต่ไม่ก้าวร้าว",
  "Will bark to alert you, but friendly": "เห่าเตือนให้รู้ตัว แต่ยังเป็นมิตร",
  "Highly protective": "ปกป้องสูง",
  "Very protective of home and family": "ปกป้องบ้านและครอบครัวมาก",
  "Very cuddly and affectionate": "ชอบกอดและอ้อนมาก",
  "Loves to be close and seeks attention often": "ชอบอยู่ใกล้และมักเรียกร้องความสนใจ",
  Subtle: "แสดงออกนุ่มๆ",
  "Express love in gentle, quiet ways": "แสดงความรักแบบอ่อนโยนและเงียบๆ",
  Independent: "รักอิสระ",
  "Enjoys independence but loyal": "ชอบมีพื้นที่ของตัวเองแต่ซื่อสัตย์",
  "Well-trained dogs only": "ต้องการสุนัขที่ฝึกมาแล้วเท่านั้น",
  "Dogs still in training": "สุนัขที่กำลังฝึกอยู่",
  "Willing to train from scratch": "พร้อมฝึกตั้งแต่เริ่มต้น",
  "Comfortable being petted by strangers": "สบายใจเมื่อคนแปลกหน้าลูบตัว",
  "Takes time to get to know new people": "ต้องใช้เวลาทำความรู้จักคนใหม่",
  "Only stick to their owner": "ผูกพันกับเจ้าของเป็นหลัก",
  "Friendly and playful": "เป็นมิตรและขี้เล่น",
  "Okay with other dogs but not too social": "อยู่กับสุนัขตัวอื่นได้ แต่ไม่เข้าสังคมมาก",
  "Prefer to be solo": "ชอบอยู่ตัวเดียวมากกว่า",
  "Cat-friendly": "เป็นมิตรกับแมว",
  "Not sure / No": "ไม่แน่ใจ / ไม่",
  "Kid-friendly": "เป็นมิตรกับเด็ก",
  "Medical conditions": "มีภาวะทางการแพทย์",
  "Behavioral challenges": "มีพฤติกรรมที่ต้องดูแลเป็นพิเศษ",
  "Special diet requirements": "ต้องการอาหารเฉพาะ",
  "No special needs preferred": "ไม่ต้องการความต้องการพิเศษ",
  Messages: "ข้อความ",
  "Your conversations with shelters": "บทสนทนาของคุณกับศูนย์พักพิง",
  "Messages are temporarily unavailable. Your appointment conversations will appear here again soon.": "ข้อความใช้งานไม่ได้ชั่วคราว บทสนทนาเกี่ยวกับนัดหมายจะกลับมาแสดงที่นี่เร็วๆ นี้",
  "Conversations are enabled when you book a shelter visit.": "บทสนทนาจะเปิดใช้งานเมื่อคุณจองเวลาเยี่ยมศูนย์พักพิง",
  "Sign in to message shelters and track your adoption journey.": "เข้าสู่ระบบเพื่อส่งข้อความหาศูนย์พักพิงและติดตามเส้นทางการรับเลี้ยง",
  "Your appointments": "นัดหมายของคุณ",
  "Sign in to view and book shelter visits": "เข้าสู่ระบบเพื่อดูและจองเวลาเยี่ยมศูนย์พักพิง",
  "About PawJai": "เกี่ยวกับ PawJai",
  "How adoption works": "ขั้นตอนการรับเลี้ยง",
  "How Adoption Works": "ขั้นตอนการรับเลี้ยง",
  "Partner shelters": "ศูนย์พักพิงพาร์ทเนอร์",
  "Partner Shelters": "ศูนย์พักพิงพาร์ทเนอร์",
  "Contact us": "ติดต่อเรา",
  "Contact Us": "ติดต่อเรา",
  "Help center": "ศูนย์ช่วยเหลือ",
  "Signed in as": "เข้าสู่ระบบในชื่อ",
  "Subscription & Payment Methods": "แพ็กเกจและวิธีชำระเงิน",
  "Email & password": "อีเมลและรหัสผ่าน",
  "Manage your sign-in": "จัดการการเข้าสู่ระบบ",
  "Notifications": "การแจ้งเตือน",
  "Adoption updates and reminders": "อัปเดตการรับเลี้ยงและการแจ้งเตือน",
  "Privacy": "ความเป็นส่วนตัว",
  "Data and document controls": "การจัดการข้อมูลและเอกสาร",
  "Language": "ภาษา",
  "English / Thai": "อังกฤษ / ไทย",
  "PawJai home": "หน้าแรก PawJai",
  "Save dogs and book shelter visits": "บันทึกสุนัขและจองเวลาเยี่ยมศูนย์พักพิง",
  "PawJai v0.1 · Made with ❤️ for Thai dogs": "PawJai v0.1 · ทำด้วยใจเพื่อสุนัขไทย",
  "PawJai · v0.1": "PawJai · v0.1",
  "Edit Profile": "แก้ไขโปรไฟล์",
  "Change cover photo": "เปลี่ยนรูปหน้าปก",
  "Change profile photo": "เปลี่ยนรูปโปรไฟล์",
  Change: "เปลี่ยน",
  "Your name": "ชื่อของคุณ",
  "Tap the banner or profile photo to upload.": "แตะแบนเนอร์หรือรูปโปรไฟล์เพื่ออัปโหลด",
  "Tap photo or banner to upload": "แตะรูปโปรไฟล์หรือแบนเนอร์เพื่ออัปโหลด",
  "First Adopter": "ผู้รับเลี้ยงคนแรก",
  "Top Donor": "ผู้บริจาคสูงสุด",
  "Premium User": "ผู้ใช้พรีเมียม",
  "Tap to replace": "แตะเพื่อเปลี่ยน",
  "Already uploaded · tap to replace": "อัปโหลดแล้ว · แตะเพื่อเปลี่ยน",
  "Click to upload · JPG, PNG, WEBP, HEIC, or PDF": "คลิกเพื่ออัปโหลด · JPG, PNG, WEBP, HEIC หรือ PDF",
  Remove: "ลบ",
  "Previously uploaded": "อัปโหลดไว้ก่อนหน้า",
  "Adding new files will replace these on submit.": "การเพิ่มไฟล์ใหม่จะแทนที่ไฟล์เหล่านี้เมื่อส่ง",
  "Upload replacement files": "อัปโหลดไฟล์ใหม่แทน",
  "Click to upload files": "คลิกเพื่ออัปโหลดไฟล์",
  "Leave documents?": "ออกจากหน้าเอกสารไหม?",
  "Your completed sections stay saved so you only need to finish this process once.": "ส่วนที่ทำเสร็จแล้วจะถูกบันทึกไว้ คุณจึงทำขั้นตอนนี้ให้เสร็จเพียงครั้งเดียว",
  "Keep editing": "แก้ไขต่อ",
  "Complete this once, then you can keep booking shelter visits without redoing the full document flow.": "ทำขั้นตอนนี้ให้เสร็จหนึ่งครั้ง แล้วคุณจะจองเวลาเยี่ยมศูนย์พักพิงได้โดยไม่ต้องกรอกเอกสารใหม่ทั้งหมด",
  "No dogs saved yet": "ยังไม่ได้บันทึกสุนัข",
  "Swipe and save the ones that catch your heart": "ปัดดูและบันทึกตัวที่ถูกใจ",
  "Browse Dogs": "ดูสุนัข",
  "My Adopted Pets": "สัตว์เลี้ยงที่รับเลี้ยงแล้ว",
  "Chat with your adopted companions": "แชทกับเพื่อนที่คุณรับเลี้ยง",
  "Sign in to view your adopted pets.": "เข้าสู่ระบบเพื่อดูสัตว์เลี้ยงที่รับเลี้ยงแล้ว",
  "No adopted pets yet": "ยังไม่มีสัตว์เลี้ยงที่รับเลี้ยงแล้ว",
  "Pets you complete an adoption with will show up here, where you can chat with shelters and keep updates flowing.": "สุนัขที่คุณรับเลี้ยงสำเร็จจะแสดงที่นี่ คุณสามารถแชทกับศูนย์พักพิงและติดตามอัปเดตได้",
  "Find a companion": "หาเพื่อนคู่ใจ",
  "Sign in to view your profile and wishlist.": "เข้าสู่ระบบเพื่อดูโปรไฟล์และ Wishlist",
  "Sign in to manage your settings.": "เข้าสู่ระบบเพื่อจัดการการตั้งค่า",
  "Manage your plan and billing": "จัดการแพ็กเกจและการชำระเงิน",
  "FAQs and guides": "คำถามที่พบบ่อยและคู่มือ",
  "Your upcoming shelter visits": "นัดหมายเยี่ยมศูนย์พักพิงที่กำลังจะมาถึง",
  UPCOMING: "กำลังจะมาถึง",
  PAST: "ที่ผ่านมา",
  Accepted: "ยอมรับแล้ว",
  Denied: "ปฏิเสธแล้ว",
  Visited: "เยี่ยมแล้ว",
  Missed: "พลาดนัด",
  Pending: "รอการตอบรับ",
  "Shelter approved this visit": "ศูนย์พักพิงอนุมัตินัดหมายนี้แล้ว",
  "Shelter could not accept this visit": "ศูนย์พักพิงไม่สามารถรับนัดหมายนี้ได้",
  "Visit completed": "เยี่ยมเสร็จแล้ว",
  "Visit was missed": "ไม่ได้ไปตามนัด",
  "Waiting for shelter decision": "กำลังรอศูนย์พักพิงตอบรับ",
  "Your Documents": "เอกสารของคุณ",
  "Complete verification to unlock bookings": "ยืนยันตัวตนให้เสร็จเพื่อปลดล็อกการจอง",
  "No past visits yet": "ยังไม่มีนัดหมายที่ผ่านมา",
  "No appointments yet": "ยังไม่มีนัดหมาย",
  "Visits you completed or missed will appear here": "นัดหมายที่เสร็จสิ้นหรือพลาดจะปรากฏที่นี่",
  "Book a shelter visit to meet your future companion": "จองเวลาเยี่ยมศูนย์พักพิงเพื่อพบเพื่อนตัวใหม่",
  "See upcoming": "ดูนัดหมายที่จะมาถึง",
  "Modify visit date and time": "แก้ไขวันและเวลานัดหมาย",
  "Shelter requested a new time": "ศูนย์พักพิงขอเปลี่ยนเวลาใหม่",
  Accept: "ยอมรับ",
  Different: "เวลาอื่น",
  Date: "วันที่",
  Time: "เวลา",
  "Modify date and time": "แก้ไขวันและเวลา",
  "Request update": "ขอเปลี่ยนเวลา",
  Shelter: "ศูนย์พักพิง",
  "Verified Shelter": "ศูนย์พักพิงที่ยืนยันแล้ว",
  "Back to home": "กลับหน้าแรก",
  "Remove from wishlist": "ลบออกจาก Wishlist",
  "Save to wishlist": "บันทึกลง Wishlist",
  "Make an Appointment": "นัดหมาย",
  "Verify to book →": "ยืนยันตัวตนเพื่อจอง →",
  "Complete one-time verification, then book any visit instantly.": "ยืนยันตัวตนครั้งเดียว แล้วจองนัดหมายได้ทันที",
  "Browse & Match": "ค้นหาและแมตช์",
  "Swipe through profiles of dogs waiting for homes. Our smart matching learns your preferences over time.": "ปัดดูโปรไฟล์สุนัขที่รอบ้าน ระบบแมตช์จะเรียนรู้ความชอบของคุณเรื่อยๆ",
  "Schedule a meet-and-greet at the shelter at a time that suits you. No adoption pressure — just a friendly visit.": "เลือกเวลาพบสุนัขที่ศูนย์พักพิงตามที่สะดวก ไม่มีแรงกดดัน แค่ไปทำความรู้จักกัน",
  "Adopt & Celebrate": "รับเลี้ยงและฉลอง",
  "Complete the adoption paperwork with the shelter and bring your new companion home!": "ทำเอกสารรับเลี้ยงกับศูนย์พักพิง แล้วพาเพื่อนใหม่กลับบ้าน",
};

const BREED_TH: Record<string, string> = {
  Thai: "ไทย",
  "Thai Ridgeback": "ไทยหลังอาน",
  "Thai Bangkaew": "ไทยบางแก้ว",
  "Thai mix": "พันธุ์ผสมไทย",
  "Thai Mix": "พันธุ์ผสมไทย",
  Beagle: "บีเกิล",
  Chihuahua: "ชิวาวา",
  Pug: "ปั๊ก",
  Labrador: "ลาบราดอร์",
  "Labrador Retriever": "ลาบราดอร์ รีทรีฟเวอร์",
  Husky: "ฮัสกี้",
  "Siberian Husky": "ไซบีเรียน ฮัสกี้",
  "Golden Retriever": "โกลเด้น รีทรีฟเวอร์",
  "Bull Terrier": "บูลเทอร์เรีย",
  Poodle: "พุดเดิล",
  Terrier: "เทอร์เรีย",
  "Poodle Terrier Mix": "พุดเดิลเทอร์เรียผสม",
  Corgi: "คอร์กี้",
  "Corgi Mixed": "คอร์กี้ผสม",
  "German Shepherd": "เยอรมันเชพเพิร์ด",
  "German Shepard Mixed": "เยอรมันเชพเพิร์ดผสม",
  Shiba: "ชิบะ",
  "Shiba Inu": "ชิบะอินุ",
  Spitz: "สปิตซ์",
  "Pomeranian": "ปอมเมอเรเนียน",
  "French Bulldog": "เฟรนช์บูลด็อก",
  "Border Collie": "บอร์เดอร์คอลลี่",
  "Shih Tzu": "ชิสุ",
};

const SIZE_TH: Record<string, string> = {
  small: "เล็ก",
  medium: "กลาง",
  large: "ใหญ่",
  extra_large: "ใหญ่มาก",
  "extra large": "ใหญ่มาก",
};

export function translateText(value: string | null | undefined, language: Language): string {
  if (!value || language === "en") return value ?? "";

  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const text = value.trim();
  if (!text) return value;

  const translated = THAI_TEXT[text] ?? BREED_TH[text] ?? translateDynamicText(text);
  return translated ? `${leading}${translated}${trailing}` : value;
}

export function translateDogValue(value: string | null | undefined, language: Language): string {
  if (!value) return "";
  if (language === "en") return value;
  const normalized = value.replace(/_/g, " ").trim();
  return THAI_TEXT[normalized] ?? BREED_TH[normalized] ?? SIZE_TH[value] ?? SIZE_TH[normalized] ?? normalized;
}

export function translateAgeLabel(value: string | null | undefined, language: Language): string {
  if (!value || language === "en") return value ?? "";
  return translateDynamicText(value) ?? value;
}

function translateDynamicText(text: string): string | null {
  let match = text.match(/^(\d+)\s+dogs?$/i);
  if (match) return `${match[1]} ตัว`;

  match = text.match(/^UPCOMING\s+\((\d+)\)$/);
  if (match) return `กำลังจะมาถึง (${match[1]})`;

  match = text.match(/^PAST\s+\((\d+)\)$/);
  if (match) return `ที่ผ่านมา (${match[1]})`;

  match = text.match(/^Complete verification to unlock bookings\s+·\s+status:\s+(.+)$/i);
  if (match) return `ยืนยันตัวตนให้เสร็จเพื่อปลดล็อกการจอง · สถานะ: ${translateText(match[1], "th")}`;

  match = text.match(/^(\d+)\s+treats?$/i);
  if (match) return `ขนม ${match[1]} ชิ้น`;

  match = text.match(/^Status:\s*(.+)$/i);
  if (match) return `สถานะ: ${translateText(match[1], "th")}`;

  match = text.match(/^About\s+(.+)$/);
  if (match) return `เกี่ยวกับ ${match[1]}`;

  match = text.match(/^Treat\s+(.+)$/);
  if (match) return `ส่งขนมให้ ${match[1]}`;

  match = text.match(/^Sign in to send treats to\s+(.+)\.$/);
  if (match) return `เข้าสู่ระบบเพื่อส่งขนมให้ ${match[1]}`;

  match = text.match(/^Buy\s+(.+)\s+snacks and toys\s+🦴$/);
  if (match) return `ซื้อขนมและของเล่นให้ ${match[1]} 🦴`;

  match = text.match(/^Your treats go to\s+(.+)\s+to care for\s+(.+)\s+and friends\.$/);
  if (match) return `เงินขนมของคุณจะส่งให้ ${match[1]} เพื่อดูแล ${match[2]} และเพื่อนๆ`;

  match = text.match(/^Meet\s+(.+)\s+at\s+(.+)$/);
  if (match) return `นัดพบ ${match[1]} ที่ ${match[2]}`;

  match = text.match(/^Available times\s+[—-]\s+(.+)$/);
  if (match) return `เวลาที่ว่าง — ${translateText(match[1], "th")}`;

  match = text.match(/^(\d+)\s+visit times available\. Choose one below\.$/);
  if (match) return `มีเวลาให้เลือก ${match[1]} รอบ เลือกหนึ่งรอบด้านล่าง`;

  match = text.match(/^(\d+)mo$/i);
  if (match) return `${match[1]} เดือน`;

  match = text.match(/^(\d+)y$/i);
  if (match) return `${match[1]} ปี`;

  match = text.match(/^(\d+)y\s+(\d+)mo$/i);
  if (match) return `${match[1]} ปี ${match[2]} เดือน`;

  match = text.match(/^(\d+)\s+Year$/i);
  if (match) return `${match[1]} ปี`;

  match = text.match(/^(\d+)\s+Years$/i);
  if (match) return `${match[1]} ปี`;

  match = text.match(/^(\d+)\+\s+Years$/i);
  if (match) return `${match[1]}+ ปี`;

  match = text.match(/^(\d+)\s+Year\s+[–-]\s+(\d+)\s+Years$/i);
  if (match) return `${match[1]} ปี – ${match[2]} ปี`;

  match = text.match(/^(\d+)\s+Years\s+[–-]\s+(\d+)\s+Years$/i);
  if (match) return `${match[1]} ปี – ${match[2]} ปี`;

  match = text.match(/^(.+)\s+energy$/i);
  if (match) {
    const level = translateText(match[1], "th");
    return `พลังงาน${level}`;
  }

  match = text.match(/^([A-Za-z ]+)\s+Mix$/);
  if (match) {
    if (match[1].trim() === "Thai") return "พันธุ์ผสมไทย";
    const breed = BREED_TH[match[1]] ?? match[1];
    return `${breed}ผสม`;
  }

  match = text.match(/^([A-Za-z ]+)\s+Mixed$/);
  if (match) {
    if (match[1].trim() === "Thai") return "พันธุ์ผสมไทย";
    const breed = BREED_TH[match[1]] ?? match[1];
    return `${breed}ผสม`;
  }

  return null;
}
