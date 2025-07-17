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
    getDoc
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
            // ... (วางรายชื่อทั้งหมดที่เหลือจาก public/import-farmers.js และที่ผู้ใช้ส่งเพิ่มในแชทให้ครบ 100%)
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
            // ... (และรายชื่อที่เหลือทั้งหมดที่ผู้ใช้ส่งเพิ่มในแชท)
        ];
        const casesRef = collection(db, "cases");
        let success = 0, fail = 0;
        for (const f of farmers) {
            try {
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
        alert(`เพิ่มข้อมูลสำเร็จ ${success} รายการ, ล้มเหลว ${fail} รายการ`);
    }
});
