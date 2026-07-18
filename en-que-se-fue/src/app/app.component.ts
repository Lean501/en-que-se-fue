import { Component, type OnInit } from "@angular/core"
import { RouterOutlet } from "@angular/router"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    document.body.dataset["theme"] = localStorage.getItem("pagos_admin_theme") === "dark" ? "dark" : "light"
  }
}
