/**
 * SkillMap Azerbaijan - Bakı və Regionlar İnteraktiv Əmək Xəritəsi Modulu (mapModule.js)
 */

class MapModule {
    constructor(data, onSelectRegionCallback) {
        this.data = data || window.SkillMapData;
        this.onSelectRegionCallback = onSelectRegionCallback;
        this.currentSelectedId = "nerimanov";
    }

    renderMapGrid(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const regions = this.data.regionsMapData;
        let html = `
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        `;

        regions.forEach(region => {
            const isSelected = region.id === this.currentSelectedId;
            const badgeBg = region.type === "baku_district" ? "bg-indigo-100 text-indigo-800" : "bg-emerald-100 text-emerald-800";
            const badgeLabel = region.type === "baku_district" ? "Bakı Rayonu" : "Region Mərkəzi";

            html += `
                <div class="cursor-pointer transition-all duration-200 rounded-xl p-4 border ${
                    isSelected 
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20' 
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }" onclick="window.mapModuleInstance.selectRegion('${region.id}')">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBg}">
                                ${badgeLabel}
                            </span>
                            <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700">
                                NÜMUNƏ
                            </span>
                        </div>
                        <span class="text-xs text-slate-500 font-medium">
                            <i class="fas fa-briefcase mr-1 text-slate-400"></i>${region.vacanciesCount}
                        </span>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm mb-1">${region.name}</h4>
                    <p class="text-xs text-slate-500 line-clamp-1 mb-2">
                        ${region.dominantSectors.join(", ")}
                    </p>
                    <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600 font-medium">
                        <span>Orta maaş:</span>
                        <span class="font-bold text-slate-900">${region.avgSalary}</span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    selectRegion(regionId) {
        this.currentSelectedId = regionId;
        this.renderMapGrid("map-regions-grid");
        this.renderRegionDetails("map-region-detail-card", regionId);
        if (this.onSelectRegionCallback) {
            this.onSelectRegionCallback(regionId);
        }
    }

    renderRegionDetails(containerId, regionId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const region = this.data.regionsMapData.find(r => r.id === (regionId || this.currentSelectedId));
        if (!region) return;

        let skillsHtml = "";
        region.topSkills.forEach(skill => {
            skillsHtml += `
                <div class="mb-2.5">
                    <div class="flex justify-between text-xs font-semibold mb-1">
                        <span class="text-slate-700">${skill.name}</span>
                        <span class="text-indigo-600 font-bold">${skill.demand}% tələb</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2">
                        <div class="bg-indigo-600 h-2 rounded-full" style="width: ${skill.demand}%"></div>
                    </div>
                </div>
            `;
        });

        let sectorsHtml = region.dominantSectors.map(sec => 
            `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                <i class="fas fa-chart-pie mr-1.5 text-indigo-500"></i>${sec}
            </span>`
        ).join(" ");

        container.innerHTML = `
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${region.type === 'baku_district' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}">
                                ${region.type === 'baku_district' ? 'Bakı Şəhəri Rayonu' : 'Azərbaycan Regionu'}
                            </span>
                            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700">
                                PİLOT NÜMUNƏ DATA
                            </span>
                            <span class="text-xs text-slate-400">•</span>
                            <span class="text-xs text-slate-500 font-medium">Təcrübə tələbi: ${region.avgExpYears}</span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900">${region.name}</h3>
                        <p class="text-xs text-slate-500 mt-1">${region.description}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="bg-indigo-50 px-4 py-2 rounded-xl text-center border border-indigo-100">
                            <div class="text-xs text-indigo-600 font-semibold uppercase">Aktiv Vakansiya</div>
                            <div class="text-lg font-black text-indigo-950">${region.vacanciesCount}</div>
                        </div>
                        <div class="bg-emerald-50 px-4 py-2 rounded-xl text-center border border-emerald-100">
                            <div class="text-xs text-emerald-600 font-semibold uppercase">Orta Əməkhaqqı</div>
                            <div class="text-lg font-black text-emerald-950">${region.avgSalary}</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            <i class="fas fa-layer-group mr-1.5 text-indigo-500"></i>Dominant Sektorlar
                        </h4>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${sectorsHtml}
                        </div>
                        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
                            <i class="fas fa-info-circle text-indigo-500 mr-1"></i>
                            <strong>Əmək Bazarı Rəyi:</strong> Bu ərazidə işə qəbul üçün işəgötürənlər əsasən <strong>${region.topSkills[0].name}</strong> və <strong>${region.topSkills[1].name}</strong> bacarıqlarını meyar olaraq qoyurlar.
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            <i class="fas fa-fire mr-1.5 text-rose-500"></i>Ən Çox Tələb Olunan Top 5 Bacarıq
                        </h4>
                        <div class="space-y-1">
                            ${skillsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

if (typeof window !== "undefined") {
    window.MapModule = MapModule;
}
