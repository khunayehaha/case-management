import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    getDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔗 Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyD2Dr6eWDBn1NQkymaiBPWAtC7wHc0L2nQ",
    authDomain: "sugarlaw1.firebaseapp.com",
    projectId: "sugarlaw1",
    storageBucket: "sugarlaw1.appspot.com",
    messagingSenderId: "1044664723794",
    appId: "1:1044664723794:web:edfaa67d9452d2618bb28b",
    measurementId: "G-TBMSM6ZT8R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const addCaseBtn = document.getElementById("addCaseBtn");
    const caseModal = document.getElementById("caseModal");
    const borrowReturnModal = document.getElementById("borrowReturnModal");
    const adminPasswordModal = document.getElementById("adminPasswordModal");
    const caseForm = document.getElementById("caseForm");
    const borrowReturnForm = document.getElementById("borrowReturnForm");
    const adminPasswordForm = document.getElementById("adminPasswordForm");
    const caseList = document.getElementById("caseList");

    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const clearSearchBtn = document.getElementById("clearSearchBtn");

    let currentCaseId = null;
    let actionType = "";
    let pendingAction = "";

    const casesRef = collection(db, "cases");

    function renderCase(docSnap) {
        const c = docSnap.data();
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", docSnap.id);
        tr.innerHTML = `
            <td>${c.name}</td>
            <td>${c.account}</td>
            <td>${c.cabinet}</td>
            <td>${c.shelf}</td>
            <td>${c.sequence}</td>
            <td>
                <span class="status-badge ${c.status === "อยู่ในห้องสำนวน" ? "in-room" : "out-room"}">
                    ${c.status}
                </span>
            </td>
            <td>${c.user || "ไม่มีข้อมูล"}</td>
            <td>${c.date || ""}</td>
            <td class="action-buttons">
                <button class="btn-edit">แก้ไข</button>
                <button class="btn-delete">ลบ</button>
                <button class="btn-borrow">${c.status === "อยู่ในห้องสำนวน" ? "เบิก" : "คืน"}</button>
            </td>
        `;
        return tr;
    }

    onSnapshot(casesRef, snapshot => {
        caseList.innerHTML = "";
        snapshot.forEach(docSnap => {
            const tr = renderCase(docSnap);
            caseList.appendChild(tr);
        });
    });

    function openModal(modal) {
        modal.style.display = "block";
    }

    function closeModal(modal) {
        modal.style.display = "none";
    }

    document.querySelectorAll(".cancel-button, .close-button").forEach(btn => {
        btn.addEventListener("click", () => {
            closeModal(caseModal);
            closeModal(borrowReturnModal);
            closeModal(adminPasswordModal);
        });
    });

    addCaseBtn.addEventListener("click", () => {
        caseForm.reset();
        document.getElementById("caseId").value = "";
        openModal(caseModal);
    });

    caseForm.addEventListener("submit", async e => {
        e.preventDefault();
        const id = document.getElementById("caseId").value;
        const newCase = {
            name: document.getElementById("farmerName").value,
            account: document.getElementById("farmerAccountNo").value,
            cabinet: document.getElementById("cabinetNo").value,
            shelf: document.getElementById("shelfNo").value,
            sequence: document.getElementById("sequenceNo").value,
            status: "อยู่ในห้องสำนวน",
            user: "",
            date: ""
        };

        if (id) {
            await setDoc(doc(casesRef, id), newCase);
        } else {
            await addDoc(casesRef, newCase);
        }
        closeModal(caseModal);
    });

    caseList.addEventListener("click", async e => {
        const tr = e.target.closest("tr");
        const id = tr.getAttribute("data-id");
        const cSnap = await getDoc(doc(casesRef, id));
        const c = cSnap.data();

        if (e.target.classList.contains("btn-edit")) {
            currentCaseId = id;
            pendingAction = "edit";
            openModal(adminPasswordModal);
        }

        if (e.target.classList.contains("btn-delete")) {
            currentCaseId = id;
            pendingAction = "delete";
            openModal(adminPasswordModal);
        }

        if (e.target.classList.contains("btn-borrow")) {
            currentCaseId = id;
            actionType = c.status === "อยู่ในห้องสำนวน" ? "borrow" : "return";
            document.getElementById("borrowerName").value = "";

            document.getElementById("currentFarmerName").textContent = c.name;
            document.getElementById("currentFarmerAccountNo").textContent = c.account;
            document.getElementById("currentCaseStatus").textContent = c.status;
            document.getElementById("borrowReturnModalTitle").textContent =
                actionType === "borrow" ? "เบิกแฟ้มคดี" : "คืนแฟ้มคดี";

            openModal(borrowReturnModal);
        }
    });

    adminPasswordForm.addEventListener("submit", async e => {
        e.preventDefault();
        const password = document.getElementById("adminPasswordInput").value;
        if (password === "lawsugar6") {
            if (pendingAction === "edit") {
                const cSnap = await getDoc(doc(casesRef, currentCaseId));
                const c = cSnap.data();
                document.getElementById("caseId").value = currentCaseId;
                document.getElementById("farmerName").value = c.name;
                document.getElementById("farmerAccountNo").value = c.account;
                document.getElementById("cabinetNo").value = c.cabinet;
                document.getElementById("shelfNo").value = c.shelf;
                document.getElementById("sequenceNo").value = c.sequence;
                openModal(caseModal);
            } else if (pendingAction === "delete") {
                if (confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
                    await deleteDoc(doc(casesRef, currentCaseId));
                }
            }
            closeModal(adminPasswordModal);
        } else {
            alert("รหัสผ่านไม่ถูกต้อง");
        }
    });

    borrowReturnForm.addEventListener("submit", async e => {
        e.preventDefault();
        const user = document.getElementById("borrowerName").value.trim();
        const now = new Date();
        const dateTime = now.toLocaleDateString("th-TH", { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                         " " + now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });

        const cSnap = await getDoc(doc(casesRef, currentCaseId));
        const c = cSnap.data();

        if (!user) {
            alert("กรุณากรอกชื่อผู้เบิก/ผู้คืน");
            return;
        }

        if (actionType === "borrow") {
            c.status = "ถูกเบิกออกไป";
        } else {
            c.status = "อยู่ในห้องสำนวน";
        }
        c.user = user;
        c.date = dateTime;

        await setDoc(doc(casesRef, currentCaseId), c);
        closeModal(borrowReturnModal);
    });

    // 🔍 ฟังก์ชันค้นหา
    function filterCases(keyword) {
        const rows = caseList.querySelectorAll("tr");
        rows.forEach(row => {
            const nameCell = row.querySelector("td:first-child");
            if (nameCell) {
                const name = nameCell.textContent.trim();
                if (name.includes(keyword)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            }
        });
    }

    searchBtn.addEventListener("click", () => {
        const keyword = searchInput.value.trim();
        filterCases(keyword);
    });

    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        filterCases("");
    });

    // --- Import Farmers Modal Logic ---
    const importFarmersBtn = document.getElementById('importFarmersBtn');
    const importFarmersModal = document.getElementById('importFarmersModal');
    const importFarmersForm = document.getElementById('importFarmersForm');
    const importPasswordInput = document.getElementById('importPasswordInput');

    if (importFarmersBtn) {
        importFarmersBtn.addEventListener('click', () => {
            importPasswordInput.value = '';
            importFarmersModal.style.display = 'block';
        });
    }
    if (importFarmersModal) {
        importFarmersModal.querySelector('.close-button').addEventListener('click', () => {
            importFarmersModal.style.display = 'none';
        });
        importFarmersForm.querySelector('.cancel-button').addEventListener('click', () => {
            importFarmersModal.style.display = 'none';
        });
    }
    if (importFarmersForm) {
        importFarmersForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (importPasswordInput.value === 'lawsugar6') {
                await importFarmers();
                importFarmersModal.style.display = 'none';
            } else {
                alert('รหัสผ่านไม่ถูกต้อง');
            }
        });
    }

    // --- Import Farmers Function ---
    async function importFarmers() {
        // หมายเหตุ: ถ้ากด import ซ้ำ ข้อมูลจะถูกเพิ่มซ้ำใน Firestore เว้นแต่ account ซ้ำ จะข้าม
        const farmers = [
            { account: '218364', name: 'นายทรัพย์  บรรเทิงใจ', cabinet: '3', shelf: '1', sequence: '1' },
            { account: '233240', name: 'นางสุรีย์พร คันทะชัย', cabinet: '3', shelf: '1', sequence: '2' },
            { account: '89970', name: 'น.ส.สุรดา  จิตรพิมาย', cabinet: '3', shelf: '1', sequence: '3' },
            { account: '21189', name: 'นายเวิน  พลมีศักดิ์', cabinet: '3', shelf: '1', sequence: '4' },
            { account: '281371', name: 'นายต๋อย ปะนามะสา', cabinet: '3', shelf: '1', sequence: '5' },
            { account: '199326', name: 'นางติม คะเรรัมย์', cabinet: '3', shelf: '1', sequence: '6' },
            { account: '258064', name: 'นายสมปอง  บุตรตา', cabinet: '3', shelf: '1', sequence: '7' },
            { account: '185764', name: 'นายกิตติพัฒน์ สามีรัมย์', cabinet: '3', shelf: '1', sequence: '8' },
            { account: '267426', name: 'นายบุญยนต์ จะภีรัมย์', cabinet: '3', shelf: '1', sequence: '9' },
            { account: '227657', name: 'นายอภิปรินทร์ บุญสุข', cabinet: '3', shelf: '1', sequence: '10' },
            { account: '242095', name: 'นางลำเพย ฉิวรัมย์', cabinet: '3', shelf: '1', sequence: '11' },
            { account: '291388', name: 'นางขนิษฐา จินดาศรี', cabinet: '3', shelf: '1', sequence: '12' },
            { account: '280526', name: 'นายนก  ตะเกิงสุข', cabinet: '3', shelf: '1', sequence: '13' },
            { account: '294071', name: 'นายสุวัฒน์  จิตตวิวัฒนา', cabinet: '3', shelf: '1', sequence: '14' },
            { account: '178657', name: 'นายบุญช่วย  พลเจริญ', cabinet: '3', shelf: '1', sequence: '15' },
            { account: '210602', name: 'นางบุษบา  ศรีนิล', cabinet: '3', shelf: '1', sequence: '16' },
            { account: '143564', name: 'นางคำผาย  นาคสุข', cabinet: '3', shelf: '1', sequence: '17' },
            { account: '254195', name: 'นายชาลี  ยั่งนา', cabinet: '3', shelf: '1', sequence: '18' },
            { account: '173540', name: 'นายทองแดง  เอี่ยมสะอาด', cabinet: '3', shelf: '1', sequence: '19' },
            { account: '185919', name: 'นางสาวสัมพันธ์  เจือนรัมย์', cabinet: '3', shelf: '1', sequence: '20' },
            { account: '268457', name: 'น.ส.กรภัทร  คงรัมย์', cabinet: '3', shelf: '1', sequence: '21' },
            { account: '19926', name: 'น.ส.บรรยาย  พันธ์ล้อมโส', cabinet: '3', shelf: '1', sequence: '22' },
            { account: '276019', name: 'นายยอดชาย  ยิงรัมย์', cabinet: '3', shelf: '1', sequence: '23' },
            { account: '9363', name: 'นายปราโมทย์  อินทร์สุข', cabinet: '3', shelf: '1', sequence: '24' },
            { account: '279371', name: 'นายวิเชียร  อุบลเผื่อน', cabinet: '3', shelf: '1', sequence: '25' },
            { account: '190988', name: 'นายสมชาย  ศรีสวัสดิ์', cabinet: '3', shelf: '1', sequence: '26' },
            { account: '96611', name: 'นายบุญเลี้ยง  เกตุแสนดี', cabinet: '3', shelf: '1', sequence: '27' },
            { account: '239019', name: 'นายบุญถม  บุญทัตวงศ์', cabinet: '3', shelf: '1', sequence: '28' },
            { account: '98082', name: 'นายนพรัตน์  เลือดสุรินทร์', cabinet: '3', shelf: '1', sequence: '29' },
            { account: '270840', name: 'นายวิทยา  มีกระใจ', cabinet: '3', shelf: '1', sequence: '30' },
            { account: '104281', name: 'นายบุญจันทร์  โอทารัมย์', cabinet: '3', shelf: '1', sequence: '31' },
            { account: '197164', name: 'นายสมศักดิ์  มะลิ', cabinet: '3', shelf: '1', sequence: '32' },
            { account: '102943', name: 'นายสมชาย  ตอรัมย์', cabinet: '3', shelf: '1', sequence: '33' },
            { account: '229719', name: 'น.ส.ปัญจนาภรณ์ อิ่มสำราญ', cabinet: '3', shelf: '1', sequence: '34' },
            { account: '13494', name: 'นายธนินท์ธร  ทินปราณี', cabinet: '3', shelf: '1', sequence: '35' },
            { account: '269171', name: 'นายไผ่  อโรคา', cabinet: '3', shelf: '1', sequence: '36' },
            { account: '46856', name: 'นายบุญเลี้ยง  สอนวงศ์แก้ว', cabinet: '3', shelf: '1', sequence: '37' },
            { account: '292064', name: 'นายเมธาวี  เป็นเครือ', cabinet: '3', shelf: '1', sequence: '38' },
            { account: '142888', name: 'นายประจิต  แสงประโคน', cabinet: '3', shelf: '1', sequence: '39' },
            { account: '294988', name: 'นายสนามชัย  ปาปะกาย', cabinet: '3', shelf: '1', sequence: '40' },
            { account: '229733', name: 'นายอาลัย  ทะยานรัมย์', cabinet: '3', shelf: '1', sequence: '41' },
            { account: '238719', name: 'นางสาววรรณา  การอินทร์', cabinet: '3', shelf: '1', sequence: '42' },
            { account: '305264', name: 'นางศรีวิไล  ตะโสรัตน์', cabinet: '3', shelf: '1', sequence: '43' },
            { account: '208557', name: 'นายสุนทร  นอสีดา', cabinet: '3', shelf: '1', sequence: '44' },
            { account: '267488', name: 'นายบรรจงศักดิ์  สายพราว', cabinet: '3', shelf: '1', sequence: '45' },
            { account: '255271', name: 'นายสัมฤทธิ์  ชะโลมรัมย์', cabinet: '3', shelf: '1', sequence: '46' },
            { account: '188488', name: 'นายสมชิต  บุตรงาม', cabinet: '3', shelf: '1', sequence: '47' },
            { account: '301326', name: 'นางอำพร  กาลเกตุ', cabinet: '3', shelf: '1', sequence: '48' },
            { account: '243964', name: 'นางเลิม  อนันต์รัมย์', cabinet: '3', shelf: '1', sequence: '49' },
            { account: '143195', name: 'น.ส.เพ็ญนภา  จะพีรัมย์', cabinet: '3', shelf: '1', sequence: '50' },
            { account: '149626', name: 'นางวิลัยวัณ  ดาสี', cabinet: '3', shelf: '2', sequence: '1' },
            { account: '269226', name: 'นางสาวสุกัญญา  สมบูรณ์รัมย์', cabinet: '3', shelf: '2', sequence: '2' },
            { account: '781511', name: 'นางสาวสพนาวัน  ชนูญรัมย์', cabinet: '3', shelf: '2', sequence: '3' },
            { account: '54983', name: 'นายบุญถม  ประนามะเส', cabinet: '3', shelf: '2', sequence: '4' },
            { account: '781744', name: 'นางปิ่น  ศาลางาม', cabinet: '3', shelf: '2', sequence: '5' },
            { account: '250295', name: 'นายวัชรินทร์  อินทะดก', cabinet: '3', shelf: '2', sequence: '6' },
            { account: '279388', name: 'นางบุญเลี้ยง  กัลยา', cabinet: '3', shelf: '2', sequence: '7' },
            { account: '172657', name: 'นายปองภพ  กิจนิยม', cabinet: '3', shelf: '2', sequence: '8' },
            { account: '162295', name: 'นายประสิทธิ์ สุทธสาร', cabinet: '3', shelf: '2', sequence: '9' },
            { account: '131633', name: 'นางสมหวัง  เพชรลือชา', cabinet: '3', shelf: '2', sequence: '10' },
            { account: '249488', name: 'นายสันติสุข  เลิศนา', cabinet: '3', shelf: '2', sequence: '11' },
            { account: '115371', name: 'นายทูล  โกติรัมย์', cabinet: '3', shelf: '2', sequence: '12' },
            { account: '226902', name: 'นายศิริพงษ์  สว่างไธสง', cabinet: '3', shelf: '2', sequence: '13' },
            { account: '165226', name: 'นายสวัสดิ์  ตะโสรัตน์', cabinet: '3', shelf: '2', sequence: '14' },
            { account: '188888', name: 'นางปริญญากร  ทองทิพย์', cabinet: '3', shelf: '2', sequence: '15' },
            { account: '241957', name: 'นางสุพิน  เปนะนาม', cabinet: '3', shelf: '2', sequence: '16' },
            { account: '268733', name: 'นายธนากร  ตุลาแสน', cabinet: '3', shelf: '2', sequence: '17' },
            { account: '781756', name: 'นายสง่า  เสาทอง', cabinet: '3', shelf: '2', sequence: '18' },
            { account: '125802', name: 'นายอุดมศักดิ์  ใบบัว', cabinet: '3', shelf: '2', sequence: '19' },
            { account: '216019', name: 'นางทองล้วน  ทองศรี', cabinet: '3', shelf: '2', sequence: '20' },
            { account: '275057', name: 'นางจอย  อะรัญ', cabinet: '3', shelf: '2', sequence: '21' },
            { account: '781859', name: 'นางมิ่งขวัญ  ตะวันหะ', cabinet: '3', shelf: '2', sequence: '22' },
            { account: '80335', name: 'นายอุดม  สุดชนะ', cabinet: '3', shelf: '2', sequence: '23' },
            { account: '80917', name: 'นายสำลี  คำหมาย', cabinet: '3', shelf: '2', sequence: '24' },
            { account: '85796', name: 'นายทองใบ  ปะโปตินัง', cabinet: '3', shelf: '2', sequence: '25' },
            { account: '61213', name: 'นางอนงค์  บุตรเพชร', cabinet: '3', shelf: '2', sequence: '26' },
            { account: '94916', name: 'นายพึ่ง  รัตนะดี', cabinet: '3', shelf: '2', sequence: '27' },
            { account: '12325', name: 'นายสอน  แช่มรัมย์', cabinet: '3', shelf: '2', sequence: '28' },
            { account: '277664', name: 'นายชอบ  ทองน้ำ', cabinet: '3', shelf: '2', sequence: '29' },
            { account: '238257', name: 'นางสาวนิยม  ยันสังกัด', cabinet: '3', shelf: '2', sequence: '30' },
            { account: '253433', name: 'นายเทอดฤทธิ์  บัวนา', cabinet: '3', shelf: '2', sequence: '31' },
            { account: '305364', name: 'นางสาวโสภา  คณะโท', cabinet: '3', shelf: '2', sequence: '32' },
            { account: '70611', name: 'นายประสิทธิ์  ขันชัย', cabinet: '3', shelf: '2', sequence: '33' },
            { account: '305288', name: 'นายสมศักดิ์  นุชนารถ', cabinet: '3', shelf: '2', sequence: '34' },
            { account: '782512', name: 'นายบุญมี  สุขแสวง', cabinet: '3', shelf: '2', sequence: '35' },
            { account: '320304', name: 'นายหาญ  เย็นสบาย', cabinet: '3', shelf: '2', sequence: '36' },
            { account: '311140', name: 'นางตุ  สะเทินรัมย์', cabinet: '3', shelf: '2', sequence: '37' },
            { account: '781522', name: 'นายทองยวน  คงเจริญ', cabinet: '3', shelf: '2', sequence: '38' },
            { account: '279657', name: 'นายวินัย  พุทธชาติ', cabinet: '3', shelf: '2', sequence: '39' },
            { account: '241519', name: 'นายหนู  ทานคำ', cabinet: '3', shelf: '2', sequence: '40' },
            { account: '195971', name: 'นายเมธาสิทธิ์ ดอนสถิตย์', cabinet: '3', shelf: '2', sequence: '41' },
            { account: '176095', name: 'นายสมศักดิ์ วิชุมา', cabinet: '3', shelf: '2', sequence: '42' },
            { account: '279633', name: 'นางสาวประนัย สวายผล', cabinet: '3', shelf: '2', sequence: '43' },
            { account: '239988', name: 'นายกฤษณะ ชนะเพีย', cabinet: '3', shelf: '2', sequence: '44' },
            { account: '202102', name: 'นายเสริฐ คะเชนรัมย์', cabinet: '3', shelf: '2', sequence: '45' },
            { account: '256264', name: 'นายธิติพจน์ แย้มศรี', cabinet: '3', shelf: '2', sequence: '46' },
            { account: '113726', name: 'นายสมพิศ ลีถา', cabinet: '3', shelf: '2', sequence: '47' },
            { account: '97038', name: 'นายวีระโชติ เย็นสุข', cabinet: '3', shelf: '2', sequence: '48' },
            { account: '254271', name: 'นางศิริไพ สำเรียนรัมย์', cabinet: '3', shelf: '2', sequence: '49' },
            { account: '281157', name: 'นางสาวเซียน ปักกาสาร', cabinet: '3', shelf: '2', sequence: '50' },
            { account: '166602', name: 'นางธนาภา ชุมเสนา', cabinet: '3', shelf: '3', sequence: '1' },
            { account: '179233', name: 'นางสง่า ปลุกไธสง', cabinet: '3', shelf: '3', sequence: '2' },
            { account: '213157', name: 'นายวรชัย พริ้งไทย', cabinet: '3', shelf: '3', sequence: '3' },
            { account: '277588', name: 'นางสาวสมพร แป้นประโคน', cabinet: '3', shelf: '3', sequence: '4' },
            { account: '320290', name: 'นายทองจันทร์ มุกดา', cabinet: '3', shelf: '3', sequence: '5' },
            { account: '303571', name: 'นายปิยโรจน์ โครัมย์', cabinet: '3', shelf: '3', sequence: '6' },
            { account: '303419', name: 'นางสุมนต์ โอกรุงรัมย์', cabinet: '3', shelf: '3', sequence: '7' },
            { account: '114119', name: 'นางทองม้วน ฉัตรพัน', cabinet: '3', shelf: '3', sequence: '8' },
            { account: '273026', name: 'นายศรีรัตน์ มูลศาสตร์', cabinet: '3', shelf: '3', sequence: '9' },
            { account: '145895', name: 'นายเฉลียว มุ่งดี', cabinet: '3', shelf: '3', sequence: '10' },
            { account: '232726', name: 'นางสาวฉัตรสุดา หวังผล', cabinet: '3', shelf: '3', sequence: '11' },
            { account: '148288', name: 'นายเสนอ สองประโคน', cabinet: '3', shelf: '3', sequence: '12' },
            { account: '285788', name: 'นางไสว นิเรืองรัมย์', cabinet: '3', shelf: '3', sequence: '13' },
            { account: '163202', name: 'นางจำปา สุขโน', cabinet: '3', shelf: '3', sequence: '14' },
            { account: '239602', name: 'นายทองดี  โพธิ์สีดี', cabinet: '3', shelf: '3', sequence: '15' },
            { account: '19373', name: 'นายตู้ เที่ยงธรรม', cabinet: '3', shelf: '3', sequence: '16' },
            { account: '246864', name: 'นางชุมแพ  แม่นพันธ์', cabinet: '3', shelf: '3', sequence: '17' },
            { account: '94992', name: 'นายตุ้ย  มีแก้ว', cabinet: '3', shelf: '3', sequence: '18' },
            { account: '9938', name: 'นางสาวยุธณี แซ่อึ้ง', cabinet: '3', shelf: '3', sequence: '19' },
            { account: '119440', name: 'นายพริ้ง  โอนประโคน (โอนรัมย์)', cabinet: '3', shelf: '3', sequence: '' },
            { account: '272840', name: 'นายณรงค์ศักดิ์  มุ่งดี', cabinet: '3', shelf: '3', sequence: '21' },
            { account: '213671', name: 'นายชูชัย พนองรัมย์', cabinet: '3', shelf: '3', sequence: '22' },
            { account: '161919', name: 'นายสนุก เอกวิเศษ', cabinet: '3', shelf: '3', sequence: '23' },
            { account: '271019', name: 'นายรังสรรค์ จริงไธสง', cabinet: '3', shelf: '3', sequence: '24' },
            { account: '139588', name: 'นายเคน ขันติวงศ์', cabinet: '3', shelf: '3', sequence: '25' },
            { account: '255433', name: 'นางอรุณี  มุ่งมี', cabinet: '3', shelf: '3', sequence: '26' },
            { account: '77265', name: 'นายบุญมา  ยศหลวงทุ่ม', cabinet: '3', shelf: '3', sequence: '27' },
            { account: '284740', name: 'นายแก่นนคร แย้มศิริ', cabinet: '3', shelf: '3', sequence: '28' },
            { account: '345603', name: 'นายภัทวพงษ์ พินัยรัมย์', cabinet: '3', shelf: '4', sequence: '1' },
            { account: '341603', name: 'นายเตือน ทองเพ็ชร์', cabinet: '3', shelf: '4', sequence: '2' },
            { account: '338744', name: 'นางนวภรณ์ เนตรดำกุล', cabinet: '3', shelf: '4', sequence: '3' },
            { account: '300919', name: 'นางสาวพิจิตรา แผ้วพลสง', cabinet: '3', shelf: '4', sequence: '4' },
            { account: '298888', name: 'นายวัฒนชัย อาจวิชัย', cabinet: '3', shelf: '4', sequence: '5' },
            { account: '283546', name: 'นางนงนุช ดาวไรรัมย์', cabinet: '3', shelf: '4', sequence: '6' },
            { account: '283495', name: 'นางสาวฐิตารีย์ หมายสม', cabinet: '3', shelf: '4', sequence: '7' },
            { account: '280926', name: 'นายอวย เชิดรัมย์', cabinet: '3', shelf: '4', sequence: '8' },
            { account: '276702', name: 'นายยอดรัก นับถือสุข', cabinet: '3', shelf: '4', sequence: '9' },
            { account: '267033', name: 'นายศราวุฒิ  ลวดเงิน', cabinet: '3', shelf: '4', sequence: '10' },
            { account: '250688', name: 'นายทวีวัฒน์ ชะยอยรัมย์', cabinet: '3', shelf: '4', sequence: '11' },
            { account: '236433', name: 'นางบุญชู  พิเดช', cabinet: '3', shelf: '4', sequence: '12' },
            { account: '229426', name: 'นายสนิท เสือจุ้ย', cabinet: '3', shelf: '4', sequence: '13' },
            { account: '228533', name: 'นายอธิพันธ์  ยอรัมย์', cabinet: '3', shelf: '4', sequence: '14' },
            { account: '211826', name: 'นายสุพรรณศรี สนธิรัมย์', cabinet: '3', shelf: '4', sequence: '15' },
            { account: '182433', name: 'นายอดิศักดิ์ แซ่ตัง', cabinet: '3', shelf: '4', sequence: '16' },
            { account: '181326', name: 'นายชรินทร์  วันภักดี', cabinet: '3', shelf: '4', sequence: '17' },
            { account: '181319', name: 'นายบุญถม วงษาชัย', cabinet: '3', shelf: '4', sequence: '18' },
            { account: '180695', name: 'นางสุนันท์  ขาวรัมย์', cabinet: '3', shelf: '4', sequence: '19' },
            { account: '146257', name: 'นายปรีชา  สีโสภา', cabinet: '3', shelf: '4', sequence: '20' },
            { account: '178895', name: 'นายไชยยา ปะนามะตัง', cabinet: '3', shelf: '4', sequence: '21' },
            { account: '174319', name: 'นายนพดล เหล็กดี', cabinet: '3', shelf: '4', sequence: '22' },
            { account: '133271', name: 'นางโสภา  ตลับทอง', cabinet: '3', shelf: '4', sequence: '23' },
            { account: '78860', name: 'นายพรมมา โพธิ์วิเศษ', cabinet: '3', shelf: '4', sequence: '24' },
            { account: '272633', name: 'นายประยูร คงเจริญ', cabinet: '3', shelf: '4', sequence: '25' },
            { account: '120271', name: 'นางสาวกัญญาณ์ภัคณ์ เลยไธสง', cabinet: '3', shelf: '4', sequence: '26' },
            { account: '112195', name: 'นายวุฒิชัย  ดอกยี่สุ่น', cabinet: '3', shelf: '4', sequence: '27' },
            { account: '254833', name: 'นายทินกร  ปรึกไธสง', cabinet: '3', shelf: '4', sequence: '28' },
            { account: '252757', name: 'นายรังสรรค์ วิชัยรัมย์', cabinet: '3', shelf: '4', sequence: '29' },
            { account: '245895', name: 'นายนพดล ผาดไธสง', cabinet: '3', shelf: '4', sequence: '30' },
            { account: '140057', name: 'นางคำตัน  ตะริดโน', cabinet: '3', shelf: '4', sequence: '31' },
            { account: '167957', name: 'นางปาริชาต  สราญบุรุษ', cabinet: '3', shelf: '4', sequence: '32' },
            { account: '177957', name: 'นางเพียวกมล  ตุลาเพียน', cabinet: '3', shelf: '4', sequence: '33' },
            { account: '21374', name: 'นายสังคม  ลาบึง', cabinet: '3', shelf: '4', sequence: '37' },
            { account: '246595', name: 'นายทองมา  กระแสเทศน์', cabinet: '3', shelf: '4', sequence: '38' },
            { account: '206795', name: 'นายสันติ  วันทะมาศ', cabinet: '3', shelf: '4', sequence: '39' },
            { account: '306133', name: 'นางอรพรรณ  เต็งสกุล', cabinet: '3', shelf: '4', sequence: '40' },
            { account: '76879', name: 'นายบุญเพชร  ทนันไธสง', cabinet: '3', shelf: '4', sequence: '41' },
            { account: '278733', name: 'นายสำเริง  สุขใส', cabinet: '3', shelf: '4', sequence: '42' },
            { account: '310795', name: 'นางสาวมณี  ทาไสย', cabinet: '3', shelf: '4', sequence: '43' },
            { account: '254057', name: 'นายภากร  ก่อแก้ว', cabinet: '3', shelf: '4', sequence: '44' },
            { account: '167795', name: 'นางจิราภา  สาแก้ว', cabinet: '3', shelf: '4', sequence: '45' },
            { account: '171633', name: 'นายสมเกียรติ  แสงรัมย์', cabinet: '3', shelf: '4', sequence: '46' },
            { account: '248488', name: 'นายสมทิน  แสนรัมย์', cabinet: '3', shelf: '4', sequence: '47' },
            { account: '317564', name: 'นางสาวสุพิชญ์ชญา  ธนาวงษ์พิสิฐ', cabinet: '3', shelf: '4', sequence: '48' },
            { account: '229833', name: 'นายอำนวย  มุมทอง', cabinet: '3', shelf: '4', sequence: '49' },
            { account: '230164', name: 'นางสาวบุญ  ดาทอง', cabinet: '3', shelf: '4', sequence: '50' },
            { account: '268295', name: 'นายสำเริง  อาญาเมือง', cabinet: '3', shelf: '4', sequence: '51' },
            { account: '303019', name: 'นายศรัณย์พล  ชินรัมย์', cabinet: '3', shelf: '4', sequence: '52' },
            { account: '311364', name: 'นายสมชาย  เจือจันทร์', cabinet: '3', shelf: '4', sequence: '53' },
            { account: '313371', name: 'นางสาวศรสา  ปลอมรัมย์', cabinet: '3', shelf: '4', sequence: '54' },
            { account: '316602', name: 'นายชูศักดิ์  อุดมพล', cabinet: '3', shelf: '4', sequence: '55' },
            { account: '317040', name: 'นายอัครวัฒน์  จีนรัมย์', cabinet: '3', shelf: '4', sequence: '56' },
            { account: '345058', name: 'นายสุบรรณ  วันจันทร์', cabinet: '3', shelf: '4', sequence: '57' },
            { account: '276988', name: 'นางสิริมาส  ศิริสุวรรณ', cabinet: '3', shelf: '4', sequence: '58' },
            { account: '178926', name: 'นายสุระ  อ่อนรัมย์', cabinet: '3', shelf: '4', sequence: '59' },
            { account: '143226', name: 'นายเย็น  ภูหลาบ', cabinet: '3', shelf: '4', sequence: '60' },
            { account: '235057', name: 'นายพงศ์ศุลี  ยวดยาน', cabinet: '3', shelf: '4', sequence: '61' },
            { account: '266226', name: 'นายปราโมทย์  สวัสดีลาภา', cabinet: '3', shelf: '4', sequence: '62' },
            { account: '279302', name: 'นายประจักร์  โอทารัมย์', cabinet: '3', shelf: '4', sequence: '63' },
            { account: '216819', name: 'นายพินิจ  นามพันธ์', cabinet: '3', shelf: '4', sequence: '64' },
            { account: '271502', name: 'นายสมโภชน์  เจือจันทร์', cabinet: '3', shelf: '4', sequence: '65' },
            { account: '302157', name: 'นายศุภชัย  หูไธสง', cabinet: '3', shelf: '4', sequence: '66' },
            { account: '271657', name: 'นายณัฐ  ดาทอง', cabinet: '3', shelf: '4', sequence: '67' },
            { account: '292526', name: 'นายเสมียน  มีศิลป์', cabinet: '3', shelf: '4', sequence: '68' },
            { account: '36909', name: 'นางสาวลำดวน  อัปมาเย', cabinet: '3', shelf: '4', sequence: '69' },
            { account: '240695', name: 'นายฉลองชัย  หอมกลิ่น', cabinet: '3', shelf: '4', sequence: '70' },
            { account: '45725', name: 'นายวอง  เทศบุตร', cabinet: '3', shelf: '4', sequence: '71' },
            { account: '190533', name: 'นายจันทร์ พร้อมจิตร', cabinet: '4', shelf: '1', sequence: '1' },
            { account: '781955', name: 'นายอรุณ มาลัยทอง', cabinet: '4', shelf: '1', sequence: '2' },
            { account: '168733', name: 'นายบุตร เอี่ยมผิว', cabinet: '4', shelf: '1', sequence: '3' },
            { account: '7644', name: 'นายศรีเดช (สาย) ภูมิกอง', cabinet: '4', shelf: '1', sequence: '4' },
            { account: '118933', name: 'นางระเบียบ  เพชรเลิศ', cabinet: '4', shelf: '1', sequence: '5' },
            { account: '119226', name: 'นายอุดร  บุตรสระน้อย', cabinet: '4', shelf: '1', sequence: '6' },
            { account: '160971', name: 'นายกำธร กองสุข', cabinet: '4', shelf: '1', sequence: '7' },
            { account: '153757', name: 'นายเพลิน พรมวิจิตร', cabinet: '4', shelf: '1', sequence: '8' },
            { account: '142095', name: 'นายสมพงษ์  ป้องทัพไทย', cabinet: '4', shelf: '1', sequence: '9' },
            { account: '174988', name: 'นายถวัลย์ บาลศิริ', cabinet: '4', shelf: '1', sequence: '10' },
            { account: '163040', name: 'นายอ่อนตา พิลาสี', cabinet: '4', shelf: '1', sequence: '11' },
            { account: '107729', name: 'นายเขต  ศรีมายา', cabinet: '4', shelf: '1', sequence: '12' },
            { account: '92684', name: 'นางสาวกรณิศา  ก๊กรัมย์', cabinet: '4', shelf: '1', sequence: '13' },
            { account: '118033', name: 'นายคมกฤษ  ชอบมี', cabinet: '4', shelf: '1', sequence: '14' },
            { account: '161833', name: 'นายสุพรรณ  คุ้มไพทูลย์', cabinet: '4', shelf: '1', sequence: '15' },
            { account: '128471', name: 'นายสมยศ  กางนอก', cabinet: '4', shelf: '1', sequence: '16' },
            { account: '163964', name: 'นายตอย  สุวรรณขันธ์', cabinet: '4', shelf: '1', sequence: '17' },
            { account: '143302', name: 'นางอำนวย  สามพร้าว', cabinet: '4', shelf: '1', sequence: '18' },
            { account: '114064', name: 'นายสำรวย  สุริเย', cabinet: '4', shelf: '1', sequence: '19' },
            { account: '120171', name: 'นายประสาท  โลมไธสง', cabinet: '4', shelf: '1', sequence: '20' },
            { account: '154195', name: 'นายอุดม  พระวิชัย', cabinet: '4', shelf: '1', sequence: '21' },
            { account: '214726', name: 'นายเลียบ สุขนา', cabinet: '4', shelf: '1', sequence: '22' },
            { account: '105705', name: 'นายสุพิศ บุญลาภ', cabinet: '4', shelf: '1', sequence: '23' },
            { account: '059546', name: 'นางบัวลอย  สมงาม', cabinet: '4', shelf: '1', sequence: '24' },
            { account: '117219', name: 'นายยอม  จะเริกรัมย์', cabinet: '4', shelf: '1', sequence: '25' },
            { account: '154188', name: 'นายนง  ทบสนธิ์', cabinet: '4', shelf: '1', sequence: '26' },
            { account: '193933', name: 'นายกิตติศักดิ์ วงศ์เกียรติขจร', cabinet: '4', shelf: '1', sequence: '27' },
            { account: '122502', name: 'นางสาวปาริชาติ วิชัยรัมย์', cabinet: '4', shelf: '1', sequence: '28' },
            { account: '104005', name: 'นายบุญตรี อนุพันธ์', cabinet: '4', shelf: '1', sequence: '29' },
            { account: '117371', name: 'นายบุญเยี่ยม  การกระสัง', cabinet: '4', shelf: '1', sequence: '30' },
            { account: '132571', name: 'นายธีรชาติ แก้วทาสี', cabinet: '4', shelf: '1', sequence: '31' },
            { account: '133826', name: 'นายพร  บุญมา', cabinet: '4', shelf: '1', sequence: '32' },
            { account: '135033', name: 'นายเจือ นิโรรัมย์', cabinet: '4', shelf: '1', sequence: '33' },
            { account: '303002', name: 'นายจันดา  วิหคเหิน', cabinet: '4', shelf: '1', sequence: '34' },
            { account: '281995', name: 'นางสาวสุนิจสา  เสนารินทร์', cabinet: '4', shelf: '1', sequence: '35' },
            { account: '317102', name: 'นางหนูจันทร์  วิเชียรรัมย์', cabinet: '4', shelf: '1', sequence: '36' },
            { account: '7303', name: 'นายมีชัย  เดชวงษา', cabinet: '4', shelf: '1', sequence: '37' },
            { account: '290226', name: 'นางสาววันดี เจริญรัมย์', cabinet: '4', shelf: '1', sequence: '38' },
            { account: '160371', name: 'นางสกุลรัตน์  ช้อนรัมย์', cabinet: '4', shelf: '1', sequence: '39' },
        ];
        const casesRef = collection(db, "cases");
        let success = 0, fail = 0, skipped = 0;
        for (const f of farmers) {
            try {
                // ตรวจสอบว่ามี account นี้อยู่แล้วหรือยัง
                const q = query(casesRef, where("account", "==", f.account));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    // ข้ามถ้ามีอยู่แล้ว
                    skipped++;
                    continue;
                }
                await addDoc(casesRef, {
                    name: f.name,
                    account: f.account,
                    cabinet: f.cabinet,
                    shelf: f.shelf,
                    sequence: f.sequence,
                    status: "อยู่ในห้องสำนวน",
                    user: "",
                    date: ""
                });
                success++;
            } catch (e) {
                fail++;
                console.error("เพิ่มข้อมูลล้มเหลว:", f, e);
            }
        }
        alert(`เพิ่มข้อมูลสำเร็จ ${success} รายการ, ข้าม ${skipped} รายการที่มีอยู่แล้ว, ล้มเหลว ${fail} รายการ`);
    }
});
